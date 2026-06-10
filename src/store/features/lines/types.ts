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

// ???!!! this will change soon
export interface LineWithTags {
	id: number;
	title: string | null;
	geometry: LineString;
	timestamp: string;
	tags: Tag[];
	stats: LineStats;
}
