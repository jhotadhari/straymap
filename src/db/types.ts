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

// // Source - https://stackoverflow.com/a/78201789
// // Posted by Michel Esteban Solarte
// // Retrieved 2026-05-26, License - CC BY-SA 4.0

// function customSet(name: string, values: string[]) {
// 	return customType<{
// 		data: string[];
// 		driverData: string;
// 	}>({
// 		dataType: () => `SET(${values.map((value) => `'${value}'`).join(',')})`,
// 		toDriver: (inputValues) => `${inputValues.join(',')}`,
// 		fromDriver: (driverValues: string) => driverValues.replace(/{|}/g, '').split(','),
// 	})(name);
// }
