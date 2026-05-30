import { sql } from 'drizzle-orm/sql';
import { customType } from 'drizzle-orm/sqlite-core';
import { LineString, Point } from 'geojson';

const params = {
	dataType() {
		return 'blob';
	},
	toDriver(value: LineString | Point) {
		const valueEpsgStr = JSON.stringify({
			...value,
			crs: {
				type: 'name',
				properties: { name: 'EPSG:4326' },
			},
		});
		return sql`GeomFromGeoJSON (${valueEpsgStr})`;
	},
};

export const lineString = customType<{
	data: LineString;
	dataDriver: string;
}>(params);

export const point = customType<{
	data: Point;
	dataDriver: string;
}>(params);
