/**
 * External dependencies
 */
import { Feature, FeatureCollection, GeoJsonProperties, LineString } from 'geojson';
import { DOMParser } from '@xmldom/xmldom';
import { gpx, kml } from '@tmcw/togeojson';

/**
 * parseLineStringFeatures extracts every LineString Feature from a parsed
 * GeoJSON object (FeatureCollection or single Feature).  MultiLineString
 * geometries are split into individual LineString features.
 */
const parseLineStringFeatures = (
	geo: FeatureCollection | Feature
): Feature<LineString, GeoJsonProperties>[] => {
	const features: Feature<LineString, GeoJsonProperties>[] = [];

	const collect = (feat: Feature) => {
		if (!feat?.geometry) {
			return;
		}
		if (feat.geometry.type === 'LineString') {
			features.push(feat as Feature<LineString, GeoJsonProperties>);
		} else if (feat.geometry.type === 'MultiLineString') {
			for (const coords of feat.geometry.coordinates) {
				features.push({
					type: 'Feature',
					properties: feat.properties,
					geometry: {
						type: 'LineString',
						coordinates: coords,
					},
				});
			}
		}
	};

	if (geo.type === 'FeatureCollection') {
		for (const f of geo.features) {
			collect(f);
		}
	} else {
		collect(geo as Feature);
	}

	return features;
};

/**
 * parseImportContent parses a file's text content into an array of
 * GeoJSON LineString Features.  Handles GPX, KML, and GeoJSON.
 *
 * Returns { features, isMulti } where isMulti is true when the source
 * file contained multiple tracks/routes (user may want to merge or split).
 */
export const parseImportContent = (
	content: string,
	format: 'gpx' | 'kml' | 'geojson'
): {
	features: Feature<LineString, GeoJsonProperties>[];
	isMulti: boolean;
} => {
	let geo: FeatureCollection | Feature;

	switch (format) {
		case 'gpx': {
			const doc = new DOMParser().parseFromString(content, 'text/xml');
			geo = gpx(doc) as FeatureCollection | Feature;
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
			return { features: [], isMulti: false };
	}

	const features = parseLineStringFeatures(geo);
	return {
		features,
		isMulti: features.length > 1,
	};
};

/**
 * Detect import format from a filename extension.
 */
export const detectImportFormat = (
	filename: string
): 'gpx' | 'kml' | 'geojson' | null => {
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
export const IMPORT_EXTENSIONS = ['gpx', 'kml', 'geojson', 'json'];
