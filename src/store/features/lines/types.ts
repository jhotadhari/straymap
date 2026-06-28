import { WithRequired } from '@tanstack/react-query';
import { LineString, Polygon } from 'geojson';

export interface Tag {
	id: number;
	label: string | null;
	notes: string | null;
	data: any; // ??? any
}

export const STATS_FIELDS = [
	'length',
	'uphill',
	'downhill',
	'minZ',
	'maxZ',
] as const;

export type LineStats = Partial<Record<(typeof STATS_FIELDS)[number], number>>;

export interface Line {
	id: number;
	title: string | null; // ??? rename to name
	geometry: LineString;
	envelope: Polygon;
	timestamp: string;
	tags: Tag[];
	data: any; // ??? any
	stats: LineStats;
}

export type LinePartial = WithRequired<Partial<Line>, 'id'>;
