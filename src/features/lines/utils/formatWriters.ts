/**
 * External dependencies
 */
import { Feature, GeoJsonProperties, LineString, Position } from 'geojson';

/**
 * Format writers for exporting LineString geometries to GPX, KML, and GeoJSON.
 *
 * GPX and KML are built as XML strings.  GeoJSON is JSON.stringify.
 */

// ---- helpers ----

const escXml = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

interface LineMeta {
	title?: string | null;
	custom_date?: string | null;
}

/** Per-coordinate metadata from track_points, aligned by array index
 * with the geometry coordinates (null where no metadata exists). */
export interface ExportPointMeta {
	timestamp: number | null;
	speed: number | null;
	gnss_altitude: number | null;
}

export interface ExportLine {
	geometry: LineString;
	meta?: LineMeta;
	points?: (ExportPointMeta | null)[];
}

const toIso = (ts: number): string => new Date(ts).toISOString();

// ---- GPX ----

const toGpxTrack = (line: ExportLine): string => {
	const { geometry, meta, points } = line;
	const coords = geometry.coordinates;
	const name = meta?.title ? `\t\t<name>${escXml(meta.title)}</name>\n` : '';
	const pts = coords
		.map((c, i) => {
			const point = points?.[i];
			let inner = '';
			if (c.length > 2) {
				inner += `\n\t\t\t\t<ele>${c[2]}</ele>`;
			}
			if (point?.timestamp != null) {
				inner += `\n\t\t\t\t<time>${toIso(point.timestamp)}</time>`;
			}
			if (inner) {
				inner += '\n\t\t\t';
			}
			return `\t\t\t<trkpt lat="${c[1]}" lon="${c[0]}">${inner}</trkpt>`;
		})
		.join('\n');

	return `\t<trk>\n${name}\t\t<trkseg>\n${pts}\n\t\t</trkseg>\n\t</trk>`;
};

export const toGpx = (lines: ExportLine[], creator = 'Straymap'): string => {
	const tracks = lines.map((l) => toGpxTrack(l)).join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<gpx version="1.1" creator="${escXml(creator)}"`,
		'  xmlns="http://www.topografix.com/GPX/1/1"',
		'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
		'  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
		tracks,
		'</gpx>',
	].join('\n');
};

// ---- KML ----

const toKmlPlacemark = (coords: Position[], meta?: LineMeta): string => {
	const name = meta?.title ? `\t\t<name>${escXml(meta.title)}</name>\n` : '';
	const coordStr = coords
		.map((c) => `${c[0]},${c[1]}${c.length > 2 ? `,${c[2]}` : ''}`)
		.join(' ');

	return [
		'\t<Placemark>',
		name + `\t\t<LineString>\n\t\t\t<coordinates>${coordStr}</coordinates>\n\t\t</LineString>`,
		'\t</Placemark>',
	].join('\n');
};

export const toKml = (lines: ExportLine[]): string => {
	const placemarks = lines.map((l) => toKmlPlacemark(l.geometry.coordinates, l.meta)).join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<kml xmlns="http://www.opengis.net/kml/2.2">',
		'\t<Document>',
		placemarks,
		'\t</Document>',
		'</kml>',
	].join('\n');
};

// ---- GeoJSON ----

export const toGeoJson = (lines: ExportLine[]): string => {
	const features: Feature<LineString, GeoJsonProperties>[] = lines.map((l) => {
		// Parallel to geometry.coordinates — nulls kept so indexes align.
		const coordTimes = l.points?.map((p) => (p?.timestamp != null ? toIso(p.timestamp) : null));
		const hasTimes = coordTimes?.some((v) => v != null) ?? false;
		return {
			type: 'Feature',
			geometry: l.geometry,
			properties: {
				...(l.meta
					? {
							title: l.meta.title ?? undefined,
							timestamp: l.meta.custom_date ?? undefined,
						}
					: {}),
				...(hasTimes ? { coordTimes } : {}),
			},
		};
	});

	return JSON.stringify(
		{
			type: 'FeatureCollection',
			features,
		},
		null,
		2
	);
};

// ---- Format list ----

export type ExportFormat = 'gpx' | 'kml' | 'geojson';

export const EXPORT_FORMATS: { key: ExportFormat; label: string }[] = [
	{ key: 'gpx', label: 'GPX' },
	{ key: 'kml', label: 'KML' },
	{ key: 'geojson', label: 'GeoJSON' },
];

export const writeFormat = (format: ExportFormat, lines: ExportLine[]): string => {
	switch (format) {
		case 'gpx':
			return toGpx(lines);
		case 'kml':
			return toKml(lines);
		case 'geojson':
			return toGeoJson(lines);
		default:
			return '';
	}
};

/**
 * Align track_points rows (indexed by point_index) into a dense array
 * parallel to the geometry coordinates, so writers can emit per-point
 * `<time>`/coordTimes.  Returns undefined when there are no rows.
 */
export const alignPointsToCoords = (
	coords: Position[],
	points:
		| {
				point_index: number;
				timestamp: number;
				speed: number | null;
				gnss_altitude: number | null;
		  }[]
		| null
		| undefined
): (ExportPointMeta | null)[] | undefined => {
	if (!points?.length) {
		return undefined;
	}
	const byIndex = new Map(points.map((p) => [p.point_index, p]));
	return coords.map((_, i) => {
		const p = byIndex.get(i);
		return p
			? {
					timestamp: p.timestamp,
					speed: p.speed,
					gnss_altitude: p.gnss_altitude,
				}
			: null;
	});
};
