import { WithRequired } from '@tanstack/react-query';
import { LineString } from 'geojson';

export interface Tag {
	id: number;
	label: string | null;
	notes: string | null;
	params: any; // ??? any
}

export interface LineStats {
	length?: number;
	uphill?: number;
	downhill?: number;
	minZ?: number;
	maxZ?: number;
}

export interface Line {
	id: number;
	title: string | null;
	geometry: LineString;
	timestamp: string;
	tags: Tag[];
	stats: LineStats;
}

export type LinePartial = WithRequired<Partial<Line>, 'id'>;
