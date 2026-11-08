/**
 * External dependencies
 */
import { Feature, FeatureCollection, GeoJsonProperties, LineString, Position } from 'geojson';
import { DOMParser } from '@xmldom/xmldom';
import { gpx, kml } from '@tmcw/togeojson';
import { XMLParser } from 'fast-xml-parser';
import dayjs from '../../../lib/dayjs';

/**
 * Fast GPX parser (fast-xml-parser) — replaces the xmldom DOM build +
 * togeojson walk for the common GPX case.  togeojson stays as fallback
 * for files the fast path cannot handle.
 *
 * Output parity with @tmcw/togeojson's gpx():
 * - one Feature per <trkseg> (togeojson folds multiple <trkseg>s of a
 *   <trk> into a MultiLineString; the app splits MultiLineStrings into
 *   per-part LineStrings anyway, so emitting per-segment features
 *   directly is equivalent)
 * - one Feature per <rte>
 * - properties: _gpxType, name, cmt, desc, type, time, src, number
 * - per-point times under properties.coordinateProperties.times
 *   (ISO strings, same shape togeojson produces)
 * - coordinates [lon, lat, ele?] with ele from <ele>
 */
const gpxXmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	removeNSPrefix: true,
	trimValues: true,
	parseTagValue: false,
	isArray: (name: string) =>
		[
			'trk',
			'rte',
			'trkseg',
			'trkpt',
			'rtept',
		].includes(name),
});

/** Normalize a fast-xml-parser text value (string | number | array | { '#text' }). */
const textOf = (v: unknown): string | undefined => {
	if (v == null) return undefined;
	if (typeof v === 'string') return v;
	if (typeof v === 'number') return String(v);
	if (Array.isArray(v)) return textOf(v[0]);
	if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) {
		return textOf((v as Record<string, unknown>)['#text']);
	}
	return undefined;
};

const pointToCoords = (pt: Record<string, unknown> | undefined): Position | null => {
	if (!pt) return null;
	const lon = parseFloat(textOf(pt['@_lon']) ?? '');
	const lat = parseFloat(textOf(pt['@_lat']) ?? '');
	if (Number.isNaN(lon) || Number.isNaN(lat)) return null;
	const ele = parseFloat(textOf(pt.ele) ?? '');
	return Number.isNaN(ele)
		? [lon, lat]
		: [
				lon,
				lat,
				ele,
			];
};

const GPX_PROPS = [
	'name',
	'cmt',
	'desc',
	'type',
	'time',
	'src',
	'number',
];

const gpxPropsOf = (node: Record<string, unknown> | undefined, gpxType: string) => {
	const props: Record<string, unknown> = { _gpxType: gpxType };
	for (const key of GPX_PROPS) {
		const v = textOf(node?.[key]);
		if (v !== undefined) props[key] = v;
	}
	return props;
};

const pointsToFeature = (
	props: Record<string, unknown>,
	points: unknown[]
): { feature: Feature<LineString, GeoJsonProperties> | null; validPointCount: number } => {
	const coords: Position[] = [];
	const times: string[] = [];
	for (const raw of points) {
		if (raw == null || typeof raw !== 'object') continue;
		const c = pointToCoords(raw as Record<string, unknown>);
		if (!c) continue;
		coords.push(c);
		const timeStr = textOf((raw as Record<string, unknown>).time);
		if (timeStr != null) times.push(timeStr);
	}
	if (coords.length < 2) return { feature: null, validPointCount: coords.length };
	return {
		feature: {
			type: 'Feature',
			properties: {
				...props,
				// Only attach times when every point has one — otherwise the
				// array can't align with the coordinates.
				...(times.length === coords.length ? { coordinateProperties: { times } } : {}),
			},
			geometry: { type: 'LineString', coordinates: coords },
		},
		validPointCount: coords.length,
	};
};

type GpxRoot = {
	gpx?: {
		trk?: unknown[] | Record<string, unknown>;
		rte?: unknown[] | Record<string, unknown>;
	};
};

/**
 * Fast GPX → FeatureCollection.  Returns null when the document can't
 * be parsed (caller falls back to xmldom + togeojson).
 */
const parseGpxFast = (content: string): { geo: FeatureCollection; tinyCount: number } | null => {
	let doc: GpxRoot | null = null;
	try {
		doc = gpxXmlParser.parse(content) as GpxRoot;
	} catch {
		return null;
	}
	const gpxNode = doc?.gpx;
	if (!gpxNode) return null;

	const features: Feature<LineString, GeoJsonProperties>[] = [];
	// Tracks/segments with exactly one usable point (zero-distance
	// recordings) can't become LineStrings — count them so the import
	// can report "too few points" instead of "nothing found".
	let tinyCount = 0;

	const collectList = (node: unknown, gpxType: 'trk' | 'rte', pointKey: 'trkpt' | 'rtept') => {
		const list = Array.isArray(node) ? node : [node];
		for (const entry of list) {
			if (entry == null || typeof entry !== 'object') continue;
			const entryObj = entry as Record<string, unknown>;
			const props = gpxPropsOf(entryObj, gpxType);
			const points =
				gpxType === 'trk'
					? // A <trk> holds one or more <trkseg>s — one feature
						// per segment, mirroring the app's MultiLineString
						// split of togeojson output.
						Array.isArray(entryObj.trkseg)
						? entryObj.trkseg
						: []
					: [entryObj];
			for (const holder of points) {
				const holderObj = holder as Record<string, unknown>;
				const pts = Array.isArray(holderObj?.[pointKey]) ? holderObj[pointKey] : [];
				const { feature, validPointCount } = pointsToFeature(props, pts);
				if (feature) {
					features.push(feature);
				} else if (validPointCount === 1) {
					tinyCount++;
				}
			}
		}
	};

	collectList(gpxNode.trk, 'trk', 'trkpt');
	collectList(gpxNode.rte, 'rte', 'rtept');

	return { geo: { type: 'FeatureCollection', features }, tinyCount };
};

/**
 * Convert a feature's togeojson-style coordinateProperties.times into
 * epoch milliseconds aligned with its coordinates.  Nested arrays
 * (togeojson multi-<trkseg> tracks) are indexed by geometry part via
 * partIndex.  Returns null when times are missing or misaligned.
 */
const featureTimes = (
	props: GeoJsonProperties | null | undefined,
	coordsCount: number,
	partIndex?: number
): number[] | null => {
	const raw = (props as any)?.coordinateProperties?.times;
	if (!Array.isArray(raw)) return null;
	const flat =
		partIndex !== undefined ? (Array.isArray(raw[partIndex]) ? raw[partIndex] : null) : raw;
	if (!flat || flat.length !== coordsCount) return null;
	const out: number[] = [];
	for (const t of flat) {
		if (typeof t !== 'string') return null;
		const ms = dayjs(t).valueOf();
		if (Number.isNaN(ms)) return null;
		out.push(ms);
	}
	return out;
};

/**
 * parseLineStringFeatures extracts every LineString Feature from a
 * parsed GeoJSON object (FeatureCollection or single Feature) and the
 * per-feature point times.  MultiLineString geometries are split into
 * individual LineString features, splitting nested time arrays
 * accordingly.
 */
const parseLineStringFeatures = (
	geo: FeatureCollection | Feature
): { features: Feature<LineString, GeoJsonProperties>[]; times: (number[] | null)[] } => {
	const features: Feature<LineString, GeoJsonProperties>[] = [];
	const times: (number[] | null)[] = [];

	const collect = (feat: Feature) => {
		if (!feat?.geometry) {
			return;
		}
		if (feat.geometry.type === 'LineString') {
			const lineString = feat as Feature<LineString, GeoJsonProperties>;
			features.push(lineString);
			times.push(featureTimes(feat.properties, lineString.geometry.coordinates.length));
		} else if (feat.geometry.type === 'MultiLineString') {
			(feat.geometry.coordinates as Position[][]).forEach((coords, partIndex) => {
				features.push({
					type: 'Feature',
					properties: feat.properties,
					geometry: {
						type: 'LineString',
						coordinates: coords,
					},
				});
				times.push(featureTimes(feat.properties, coords.length, partIndex));
			});
		}
	};

	if (geo.type === 'FeatureCollection') {
		for (const f of geo.features) {
			collect(f);
		}
	} else {
		collect(geo as Feature);
	}

	return { features, times };
};

/**
 * parseImportContent parses a file's text content into an array of
 * GeoJSON LineString Features.  Handles GPX, KML, and GeoJSON.
 *
 * GPX uses a fast-xml-parser based converter with an xmldom +
 * togeojson fallback; KML and GeoJSON use togeojson / JSON.parse.
 *
 * Returns { features, times, isMulti, tinyCount } where times[i] holds
 * per-point epoch timestamps aligned to features[i]'s coordinates (null
 * when the source has no usable per-point timestamps), isMulti is true
 * when the source file contained multiple tracks/routes, and tinyCount
 * counts tracks with exactly one point (zero-distance recordings that
 * can never become LineStrings).
 */
export const parseImportContent = (
	content: string,
	format: 'gpx' | 'kml' | 'geojson'
): {
	features: Feature<LineString, GeoJsonProperties>[];
	times: (number[] | null)[];
	isMulti: boolean;
	tinyCount: number;
} => {
	let geo: FeatureCollection | Feature;
	let tinyCount = 0;

	switch (format) {
		case 'gpx': {
			const fast = parseGpxFast(content);
			if (fast && fast.geo.features.length > 0) {
				geo = fast.geo;
			} else {
				tinyCount = fast?.tinyCount ?? 0;
				// Fallback: full DOM parse (exotic extensions, files the
				// fast path can't read, or genuinely empty files).
				try {
					const doc = new DOMParser().parseFromString(content, 'text/xml');
					geo = gpx(doc) as FeatureCollection | Feature;
				} catch {
					// Unparseable XML — treat as "no features" so callers
					// reach the friendly noFeatures flow.
					geo = { type: 'FeatureCollection', features: [] };
				}
			}
			break;
		}
		case 'kml': {
			const doc = new DOMParser().parseFromString(content, 'text/xml');
			geo = kml(doc) as FeatureCollection | Feature;
			break;
		}
		case 'geojson': {
			geo = JSON.parse(content) as FeatureCollection | Feature;
			break;
		}
		default:
			return { features: [], times: [], isMulti: false, tinyCount: 0 };
	}

	const { features, times } = parseLineStringFeatures(geo);
	return {
		features,
		times,
		isMulti: features.length > 1,
		tinyCount,
	};
};

/**
 * Detect import format from a filename extension.
 */
export const detectImportFormat = (filename: string): 'gpx' | 'kml' | 'geojson' | null => {
	const ext = filename.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'gpx':
			return 'gpx';
		case 'kml':
			return 'kml';
		case 'geojson':
		case 'json':
			return 'geojson';
		default:
			return null;
	}
};

/**
 * Supported import file extensions.
 */
export const IMPORT_EXTENSIONS = [
	'gpx',
	'kml',
	'geojson',
	'json',
];
