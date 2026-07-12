/**
 * Format writers for exporting LineString geometries to GPX, KML, and GeoJSON.
 *
 * GPX and KML are built as XML strings.  GeoJSON is JSON.stringify.
 */
import { Feature, GeoJsonProperties, LineString, Position } from 'geojson';

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
	created_at?: string | null;
}

// ---- GPX ----

const toGpxTrack = (coords: Position[], meta?: LineMeta): string => {
	const name = meta?.title ? `\t\t<name>${escXml(meta.title)}</name>\n` : '';
	const pts = coords
		.map(
			(c) =>
				`\t\t\t<trkpt lat="${c[1]}" lon="${c[0]}">${c.length > 2 ? `\n\t\t\t\t<ele>${c[2]}</ele>\n\t\t\t` : ''}</trkpt>`
		)
		.join('\n');

	return `\t<trk>\n${name}\t\t<trkseg>\n${pts}\n\t\t</trkseg>\n\t</trk>`;
};

export const toGpx = (
	lines: { geometry: LineString; meta?: LineMeta }[],
	creator = 'Straymap'
): string => {
	const tracks = lines.map((l) => toGpxTrack(l.geometry.coordinates, l.meta)).join('\n');

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

export const toKml = (lines: { geometry: LineString; meta?: LineMeta }[]): string => {
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

export const toGeoJson = (lines: { geometry: LineString; meta?: LineMeta }[]): string => {
	const features: Feature<LineString, GeoJsonProperties>[] = lines.map((l) => ({
		type: 'Feature',
		geometry: l.geometry,
		properties: l.meta
			? {
					title: l.meta.title ?? undefined,
					timestamp: l.meta.created_at ?? undefined,
				}
			: {},
	}));

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

export const writeFormat = (
	format: ExportFormat,
	lines: { geometry: LineString; meta?: LineMeta }[]
): string => {
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
