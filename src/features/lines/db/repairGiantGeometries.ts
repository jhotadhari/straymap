/**
 * External dependencies
 */
import { and, eq, gte } from 'drizzle-orm';
import { LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { withDbTransaction } from '../../dbLoader/utils';
import { linesTable, tagsToLinesTable, linePointsTable } from './schema/schema';
import { logError } from '../../../lib/utils';

/**
 * Upper bound for the number of points stored in a single LineString.
 *
 * libspatialite (a prebuilt .so — see android/app/src/main/jniLibs) and
 * Hermes both break on very large single geometries: SpatiaLite crashes
 * with a SIGSEGV when reading multi-hundred-thousand-point blobs
 * (gaiaFromSpatiaLiteBlobWkbEx), and Hermes throws "Maximum call stack
 * size exceeded (native stack depth)" when JSON-round-tripping huge
 * coordinate arrays.  Known-good in production: ~35k points.  Known
 * crashing: 61k+.  Cap at 30k to stay clear of both cliffs; the import
 * feature enforces the same cap for new data.
 */
export const LINE_MAX_POINTS = 30000;

/** Bytes per XYZ point inside the SpatiaLite internal blob. */
const POINT_BYTES = 24;

/**
 * SpatiaLite internal blob layout (verified against production data):
 *   [0..1]   0x00 0x01 fixed markers
 *   [2..5]   SRID (uint32)
 *   [6..37]  MBR (4 doubles)
 *   [38]     0x7C marker
 *   [39..42] WKB type (uint32, little-endian — 1002 = LINESTRINGZ)
 *   [43..46] point count (uint32, little-endian)
 *   [47..]   count × (3 little-endian doubles: lng, lat, z)
 *   [end]    1 trailing end-marker byte
 */
const HEADER_BYTES = 47;
const TRAILER_BYTES = 1;

const BLOB_THRESHOLD_BYTES = HEADER_BYTES + TRAILER_BYTES + LINE_MAX_POINTS * POINT_BYTES;

const hexToBytes = (hex: string): Uint8Array => {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	}
	return out;
};

const decodeCoordinates = (
	bytes: Uint8Array,
	count: number
): [
	number,
	number,
	number,
][] => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const coords: [
		number,
		number,
		number,
	][] = new Array(count);
	for (let i = 0; i < count; i++) {
		const off = HEADER_BYTES + i * POINT_BYTES;
		coords[i] = [
			view.getFloat64(off, true),
			view.getFloat64(off + 8, true),
			view.getFloat64(off + 16, true),
		];
	}
	return coords;
};

/**
 * Parse a SpatiaLite internal blob into coordinates.  Returns null when
 * the blob is not a plain little-endian LINESTRINGZ (SRID-agnostic — the
 * repair rebuilds SRID via GeomFromGeoJSON anyway).
 */
export const parseSpatiaLiteBlob = (
	hex: string,
	byteLength?: number
):
	| [
			number,
			number,
			number,
	  ][]
	| null => {
	const bytes = hexToBytes(hex);
	const len = byteLength ?? bytes.length;
	if (bytes.length < HEADER_BYTES + TRAILER_BYTES || bytes[38] !== 0x7c) {
		return null;
	}
	const type = bytes[39] + bytes[40] * 256 + bytes[41] * 65536 + bytes[42] * 16777216;
	const count = bytes[43] + bytes[44] * 256 + bytes[45] * 65536 + bytes[46] * 16777216;
	if (type !== 1002) {
		return null;
	}
	if (count < 2 || len !== HEADER_BYTES + TRAILER_BYTES + count * POINT_BYTES) {
		return null;
	}
	return decodeCoordinates(bytes, count);
};

/** Split a point count into part sizes, all ≥ 2 points and ≤ LINE_MAX_POINTS. */
export const partSizes = (count: number): number[] => {
	if (count <= LINE_MAX_POINTS) return [count];
	let partCount = Math.ceil(count / LINE_MAX_POINTS);
	// A trailing fragment of a single point is invalid (LineString needs
	// ≥ 2) — fold it into the previous part instead.
	while (count - (partCount - 1) * LINE_MAX_POINTS < 2) {
		partCount--;
	}
	const sizes: number[] = [];
	let remaining = count;
	for (let p = 0; p < partCount; p++) {
		const size = p === partCount - 1 ? remaining : LINE_MAX_POINTS;
		sizes.push(size);
		remaining -= size;
	}
	return sizes;
};

/**
 * One-time repair: split stored LineStrings that exceed LINE_MAX_POINTS
 * into multiple line rows (same source, parts titled "name (k/n)").
 *
 * Reads geometry via plain SQL (hex(geometry), length(geometry)) — no
 * SpatiaLite functions, which crash on these blobs.  Writes go through
 * the regular drizzle lineString column type (GeomFromGeoJSON), which
 * is safe for the ≤30k-point parts.  Idempotent: once no oversized
 * blobs remain, the probe returns empty and every startup only pays for
 * one cheap length() scan.
 *
 * Returns the number of repaired lines.  Call once during dbLoader init,
 * after migrations and before any feature queries geometry.
 */
export const repairGiantGeometries = async (): Promise<number> => {
	if (!dbConnection?.op || !dbConnection?.drizzle) {
		return 0;
	}

	const probe = await dbConnection.op.execute(
		'SELECT id, hex(geometry) AS h, length(geometry) AS len FROM lines WHERE length(geometry) > ?',
		[BLOB_THRESHOLD_BYTES]
	);
	const rows = probe?.rows ?? [];
	if (!rows.length) {
		return 0;
	}

	let repaired = 0;
	for (const row of rows) {
		const lineId = row.id as number;
		const hex = row.h as string;
		const byteLength = row.len as number;
		try {
			const coordinates = parseSpatiaLiteBlob(hex, byteLength);
			if (!coordinates || coordinates.length <= LINE_MAX_POINTS) {
				continue;
			}
			const count = coordinates.length;
			const sizes = partSizes(count);

			// Row metadata (raw reads — no geometry involved).
			const metaRows = await dbConnection.op.execute(
				'SELECT title, custom_date, data FROM lines WHERE id = ?',
				[lineId]
			);
			const meta = metaRows?.rows?.[0] as
				{ title?: string | null; custom_date?: string | null; data?: any } | undefined;
			const title = typeof meta?.title === 'string' ? meta.title : '';
			const tagRows = await dbConnection.op.execute(
				'SELECT tag_id FROM tags_to_lines WHERE line_id = ?',
				[lineId]
			);
			const tagIds = (tagRows?.rows ?? []).map((r) => r.tag_id as number);
			const pointRows = await dbConnection.op.execute(
				'SELECT point_index, timestamp, speed, data FROM line_points WHERE line_id = ? ORDER BY point_index',
				[lineId]
			);
			const points = pointRows?.rows ?? [];

			await withDbTransaction(async (exec) => {
				let offset = 0;
				let createdParts: { id: number }[] = [];
				for (let p = 0; p < sizes.length; p++) {
					const size = sizes[p];
					const partCoords = coordinates.slice(offset, offset + size);
					const partGeometry: LineString = {
						type: 'LineString',
						coordinates: partCoords,
					};
					const partTitle =
						sizes.length > 1 && title ? `${title} (${p + 1}/${sizes.length})` : title;

					if (p === 0) {
						// Part 1 keeps the original id/created_at — update
						// in place.  The R*Tree triggers rebuild the index.
						await exec(
							dbConnection
								.drizzle!.update(linesTable)
								.set({
									geometry: partGeometry,
									...(partTitle !== title && { title: partTitle }),
								})
								.where(eq(linesTable.id, lineId))
						);
						createdParts.push({ id: lineId });
					} else {
						const inserted = await exec(
							dbConnection.drizzle!.insert(linesTable).values({
								title: partTitle || null,
								data:
									typeof meta?.data === 'string'
										? JSON.parse(meta.data)
										: (meta?.data ?? null),
								geometry: partGeometry,
								custom_date:
									typeof meta?.custom_date === 'string'
										? meta.custom_date
										: undefined,
							})
						);
						const rawIds = (inserted?.rows ?? []).map((r) => r.id as number);
						createdParts.push(...rawIds.map((id) => ({ id })));
					}

					// Copy tags + line_points slices to the new part.
					const partId = createdParts[p]?.id;
					if (partId != null && partId !== lineId) {
						if (tagIds.length > 0) {
							await exec(
								dbConnection
									.drizzle!.insert(tagsToLinesTable)
									.values(
										tagIds.map((tagId) => ({ tag_id: tagId, line_id: partId }))
									)
							);
						}
						if (points.length > 0) {
							const partPoints = points.filter(
								(pt) =>
									(pt.point_index as number) >= offset &&
									(pt.point_index as number) < offset + size
							);
							if (partPoints.length > 0) {
								await exec(
									dbConnection.drizzle!.insert(linePointsTable).values(
										partPoints.map((pt) => ({
											line_id: partId,
											point_index: (pt.point_index as number) - offset,
											timestamp: pt.timestamp as number,
											speed: (pt.speed as number | null) ?? undefined,
											data:
												typeof pt.data === 'string'
													? JSON.parse(pt.data)
													: ((pt.data as any) ?? null),
										}))
									)
								);
							}
						}
					}
					offset += size;
				}

				// Points beyond part 1's range were moved onto the new
				// parts — drop the originals so they don't stay attached
				// to part 1's line_id.  (When the line had no points this
				// is a no-op.)
				if (sizes.length > 1 && points.length > 0) {
					await exec(
						dbConnection
							.drizzle!.delete(linePointsTable)
							.where(
								and(
									eq(linePointsTable.line_id, lineId),
									gte(linePointsTable.point_index, sizes[0])
								)
							)
					);
				}
			});

			repaired++;
		} catch (err) {
			logError('repairGiantGeometries.line', err);
		}
	}

	return repaired;
};
