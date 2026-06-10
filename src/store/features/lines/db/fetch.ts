/**
 * External dependencies
 */
import { LineString } from 'geojson';
import { sql, eq, and, inArray, desc } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbZ } from '../../../../db/client';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import { rowsParseGeometryGeoJSON } from '../../../../db/utils';
import { ArrayElement } from '../../../../types';
import { LineWithTags } from '../types';
import { mapValues } from 'lodash-es';

/**
 * Functions to fetch/retrieve data from database.
 * They are actually db selectors or drizzle queries. But to avoid naming collisions, let's call/prefix them "fetch".
 *
 */
/**
 */

interface LinesWithTagsParams {
	lineIds?: number[];
	allLines?: boolean;
	tagId?: number;
	allTags?: boolean;
}

export const fetchLinesWithTagsQuery = (params?: LinesWithTagsParams) => {
	const { lineIds, allLines, tagId, allTags } = params ?? {};

	const query = dbZ
		.select({
			line: {
				id: linesTable.id,
				title: linesTable.title,
				timestamp: linesTable.timestamp,
				geometryGeoJSON: sql<string>`AsGeoJSON (${linesTable.geometry})`,
				length: sql<string>`GreatCircleLength (${linesTable.geometry})`,
				uphill: sql<string>`UphillHeight (${linesTable.geometry})`,
				downhill: sql<string>`DownhillHeight (${linesTable.geometry})`,
				minZ: sql<string>`ST_MinZ (${linesTable.geometry})`,
				maxZ: sql<string>`ST_MaxZ (${linesTable.geometry})`,
			},
			tag: {
				id: tagsTable.id,
				label: tagsTable.label,
				notes: tagsTable.notes,
				params: tagsTable.params,
			},
		})
		.from(tagsToLinesTable);

	if (allLines) {
		query.rightJoin(linesTable, eq(tagsToLinesTable.line_id, linesTable.id));
	} else {
		query.leftJoin(linesTable, eq(tagsToLinesTable.line_id, linesTable.id));
	}
	if (allTags) {
		query.rightJoin(tagsTable, eq(tagsToLinesTable.tag_id, tagsTable.id));
	} else {
		query.leftJoin(tagsTable, eq(tagsToLinesTable.tag_id, tagsTable.id));
	}

	query.where(
		and(
			lineIds ? inArray(linesTable.id, lineIds) : undefined,
			tagId ? eq(tagsTable.id, tagId) : undefined
		)
	);

	query.orderBy(desc(linesTable.timestamp));

	return query;
};

export const fetchLinesWithTags = (params?: LinesWithTagsParams) => {
	const { lineIds, allLines, tagId, allTags } = params ?? {};

	return new Promise<LineWithTags[]>((resolve, reject) => {
		const query = fetchLinesWithTagsQuery(params);

		query
			.all() /// ??? add limit.
			.then((rows) => {
				const aggregated = Array.from(
					rows
						.reduce<
							Map<
								number,
								Omit<LineWithTags, 'geometry'> & { geometryGeoJSON: string }
							>
						>((acc, row) => {
							if (row?.line?.id && !acc.has(row.line.id)) {
								const { id, title, timestamp, geometryGeoJSON, ...stats } =
									row.line;
								acc.set(row.line.id, {
									id,
									title,
									timestamp,
									geometryGeoJSON,
									stats: mapValues(stats, (str) => parseFloat(str)),
									tags: [],
								});
							}
							if (row?.tag && row?.line?.id) {
								acc.get(row.line.id)!.tags.push(row.tag);
							}
							return acc;
						}, new Map())
						.values()
				);

				resolve(
					rowsParseGeometryGeoJSON<ArrayElement<typeof aggregated>, LineString>(
						aggregated
					)
				);
			})
			.catch((err) => {
				reject(err);
			});
	});
};
