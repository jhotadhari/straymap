/**
 * External dependencies
 */
import { Feature, GeoJsonProperties, LineString } from 'geojson';

export type ImportMode = 'file' | 'directory';

export type ImportStep = 'idle' | 'scanning' | 'parsing' | 'configuration' | 'importing' | 'result';

export type TagMode = 'none' | 'existing' | 'regex';

export type TitleMode = 'none' | 'filenameWithoutExt' | 'filenameWithExt' | 'nameProperty' | 'regex';

export type OverwriteMode = 'create' | 'skip' | 'overwrite';

export type ImportFileResult = {
	name: string;
	success: boolean;
	error?: string;
	skippedGeom?: number;
	importedCount?: number;
	overwritten?: number;
	skipped?: number;
};

export const isValidGeometry = (feature: Feature<LineString, GeoJsonProperties>): boolean => {
	const geom = feature?.geometry;
	if (!geom || geom.type !== 'LineString') return false;
	const coords = geom.coordinates;
	if (!Array.isArray(coords) || coords.length < 2) return false;
	return coords.every(
		(c) =>
			Array.isArray(c) &&
			c.length >= 2 &&
			typeof c[0] === 'number' &&
			typeof c[1] === 'number'
	);
};

export interface DatePattern {
	key: string;
	regex: string;
	format: string;
	label: string;
	enabled: boolean;
	removable: boolean;
}
