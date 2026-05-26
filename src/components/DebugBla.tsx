import { FC, useEffect } from 'react';

import { dbZ, dbOp } from '../db/client';
import { linesTable } from '../db/schema/schemaBase';
import { routesTable, routingPointsTable } from '../store/features/routing/schema/schema';
import { lineString, point } from '@turf/helpers';
import { sql } from 'drizzle-orm';
import { QueryResult, Scalar } from '@op-engineering/op-sqlite';
import { dbOpExecute } from '../db/utils';

const DebugBla: FC = () => {
	useEffect(() => {
		(async () => {
			const resI = await dbOpExecute('PRAGMA table_info(lines)');
			console.log('debug res table_info', resI); // debug

			const resG = await dbOpExecute('SELECT * FROM geometry_columns');
			console.log('debug res geometry_columns', resG); // debug

			const coords = [
				[
					-24,
					63,
					100,
				],
				[
					-23,
					60,
					100,
				],
				[
					-25,
					65,
					100,
				],
				[
					-20,
					69,
					100,
				],
			];

			try {
				await dbZ.insert(routesTable).values([
					{
						point_order: [
							1,
							2,
							3,
						],
					},
				]);
			} catch (error) {
				console.log('debug error', error); // debug
			}

			try {
				coords.forEach(async (coord) => {
					await dbZ.insert(routingPointsTable).values([
						{
							geometry: point(coord).geometry,
							route_id: 1,
							profile: {
								egal: [
									'was',
									'auch',
									'immer',
								],
							},
						},
					]);
				});
			} catch (error) {
				console.log('debug error', error); // debug
			}

			const pointGeoJSON = '{"type":"Point","coordinates":[-23, 59.5]}';

			const resultRoute = await dbZ
				.select({
					id: routesTable.id,
					point_order: routesTable.point_order,
					line_id: routesTable.line_id,
				})
				.from(routesTable);
			// .limit(1);
			console.log('debug resultRoute', resultRoute); // debug

			const resultPoint = await dbZ
				.select({
					id: routingPointsTable.id,
					// timestamp: routingPointsTable.timestamp,
					profile: routingPointsTable.profile,
					route_id: routingPointsTable.route_id,
					// geometry: routingPointsTable.geometry,
					geometryText: sql<string>`AsText (${routingPointsTable.geometry})`,
					geometryGeoJSON: sql<string>`AsGeoJSON (${routingPointsTable.geometry})`,
					distance: sql`
						ST_Distance (
							${routingPointsTable.geometry},
							GeomFromGeoJSON (${pointGeoJSON})
						)
					`.as('distance'),
				})
				.from(routingPointsTable)
				.orderBy(sql`distance ASC`);
			// .limit(1);
			console.log('debug resultPoint', resultPoint); // debug

			try {
				await dbZ.insert(linesTable).values([
					{
						geometry: lineString(coords).geometry,
						title: 'blablabla',
					},
				]);
			} catch (error) {
				console.log('debug error', error); // debug
			}

			const resultLine = await dbZ
				.select({
					id: linesTable.id,
					title: linesTable.title,
					// timestamp: linesTable.timestamp,
					// geometry: linesTable.geometry,
					// geometryText: sql<string>`AsText (${linesTable.geometry})`,
					geometryGeoJSON: sql<string>`AsGeoJSON (${linesTable.geometry})`,
					geometryEnvelope: sql<string>`AsText (Envelope (${linesTable.geometry}))`,
					geometryNumPoints: sql<number>`NumPoints (${linesTable.geometry})`,
					geometryGLength: sql<number>`GLength (${linesTable.geometry})`,
					distance: sql`
						ST_Distance (
							${linesTable.geometry},
							GeomFromGeoJSON (${pointGeoJSON})
						)
					`,
				})
				.from(linesTable)
				.orderBy(sql`id DESC`);
			// .limit(1);
			console.log('debug resultLine', resultLine); // debug
		})();
	}, []);

	return undefined;
};

export default DebugBla;
