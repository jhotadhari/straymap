import { FC, useEffect } from 'react';
import { QueryResult, Scalar } from '@op-engineering/op-sqlite';
import { lineString, point } from '@turf/helpers';
import { gt, isNotNull, sql, eq } from 'drizzle-orm';

import { dbZ, dbOp } from '../../../../db/client';
import { routesTable, routingPointsTable } from '../../routing/db/schema/schema';
import { createLines } from '../db/actionsLine';
import { createTags } from '../db/actionsTag';
import { getLinesWithTags } from '../db/selectors';
import { dbOpExecute } from '../../../../db/utils';
import { getRoutesWithPoints } from '../../routing/db/selectors';
import { createRoutingPoints, deleteRoutingPoint } from '../../routing/db/actionsRoutingPoint';
import { createRoute, createRoutes, deleteRoute, updateRoute } from '../../routing/db/actionsRoute';

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

const pointGeoJSON = '{"type":"Point","coordinates":[-23, 59.5]}';

const mockRoutes = async (point_order?: number[]) => {
	const resI = await dbOpExecute('PRAGMA table_info(routes)');
	console.log('debug res table_info routes', resI); // debug

	let inserted: number | undefined = undefined;
	try {
		inserted = await createRoute();
		if (inserted && point_order) {
			await updateRoute(inserted, { point_order });
		}
		return inserted;
	} catch (error) {
		console.log('debug error', error); // debug
		return inserted;
	}

	// const resultRoute = await dbZ
	// 	.select({
	// 		id: routesTable.id,
	// 		point_order: routesTable.point_order,
	// 		line_id: routesTable.line_id,
	// 	})
	// 	.from(routesTable);
	// // .limit(1);
	// console.log('debug resultRoute', resultRoute); // debug
};

const mockPoints = async (route_id: number) => {
	const resI = await dbOpExecute('PRAGMA table_info(routing_points)');
	console.log('debug res table_info routing_points', resI); // debug

	try {
		const inserted = await createRoutingPoints(
			coords.map((coord) => {
				return {
					feature: point(coord),
					profile: {
						egal: [
							'was',
							'auch',
							'immer',
						],
					},
				};
			}),
			route_id
		);
		return inserted;
	} catch (error) {
		console.log('debug error', error); // debug
	}

	// const resultPoint = await dbZ
	// 	.select({
	// 		id: routingPointsTable.id,
	// 		// timestamp: routingPointsTable.timestamp,
	// 		profile: routingPointsTable.profile,
	// 		route_id: routingPointsTable.route_id,
	// 		// geometry: routingPointsTable.geometry,
	// 		geometryText: sql<string>`AsText (${routingPointsTable.geometry})`,
	// 		geometryGeoJSON: sql<string>`AsGeoJSON (${routingPointsTable.geometry})`,
	// 		distance: sql`
	// 			ST_Distance (
	// 				${routingPointsTable.geometry},
	// 				GeomFromGeoJSON (${pointGeoJSON})
	// 			)
	// 		`.as('distance'),
	// 	})
	// 	.from(routingPointsTable)
	// 	.orderBy(sql`distance ASC`);
	// // .limit(1);
	// console.log('debug resultPoint', resultPoint); // debug
};

const mockLines = async () => {
	// const resI = await dbOpExecute('PRAGMA table_info(lines)');
	// console.log('debug res table_info lines', resI); // debug

	await createLines([
		{
			lineStringFeature: lineString(coords),
			tagIds: [2, 3],
		},
		{
			lineStringFeature: lineString(coords),
			tagIds: [4, 3],
		},
	]);

	// const resultLine = await dbZ
	// 	.select({
	// 		id: linesTable.id,
	// 		title: linesTable.title,
	// 		// timestamp: linesTable.timestamp,
	// 		// geometry: linesTable.geometry,
	// 		// geometryText: sql<string>`AsText (${linesTable.geometry})`,
	// 		geometryGeoJSON: sql<string>`AsGeoJSON (${linesTable.geometry})`,
	// 		geometryEnvelope: sql<string>`AsText (Envelope (${linesTable.geometry}))`,
	// 		geometryNumPoints: sql<number>`NumPoints (${linesTable.geometry})`,
	// 		geometryGLength: sql<number>`GLength (${linesTable.geometry})`,
	// 		distance: sql`
	// 			ST_Distance (
	// 				${linesTable.geometry},
	// 				GeomFromGeoJSON (${pointGeoJSON})
	// 			)
	// 		`,
	// 	})
	// 	.from(linesTable)
	// 	.orderBy(sql`id DESC`);
	// // .limit(1);
	// console.log('debug resultLine', resultLine); // debug
};

const mockTags = async () => {
	await createTags([
		{
			label: 'public transport',
			notes: 'bla bla',
			params: {
				foo: 'bar',
			},
		},
		{
			label: 'boating',
			notes: 'bla bla',
			params: {
				foo: 'bar',
			},
		},
		{
			label: 'boating',
			notes: 'bla bla',
			params: {
				foo: 'bar',
			},
		},
		{
			label: 'cycling',
			notes: 'bla bla',
			params: {
				foo: 'bar',
			},
		},
		{
			label: 'hiking',
			notes: 'bla bla',
			params: {
				foo: 'bar',
			},
		},
	]);

	// const resultTags = await dbZ
	// 	.select({
	// 		id: tagsTable.id,
	// 		label: tagsTable.label,
	// 		notes: tagsTable.notes,
	// 		params: tagsTable.params,
	// 	})
	// 	.from(tagsTable);
	// console.log('debug resultTags', resultTags); // debug
};

const DebugBla: FC = () => {
	useEffect(() => {
		(async () => {
			const resG = await dbOpExecute('SELECT * FROM geometry_columns');
			console.log('debug res geometry_columns', resG); // debug

			// // mockTags();
			// // mockLines();
			// const lines = await getLinesWithTags({
			// 	// tagId: 3
			// });
			// console.log('debug lines', lines); // debug

			const route_id = await mockRoutes();
			if (route_id) {
				await mockPoints(route_id);
				const routes = await getRoutesWithPoints({
					routeId: route_id,
				});
				console.log('debug routes', routes); // debug

				await deleteRoute(route_id);


				const resultPoint = await dbZ
					.select({
						id: routingPointsTable.id,
						route_id: routingPointsTable.route_id,
					})
					.from(routingPointsTable);
				console.log('debug resultPoint', resultPoint); // debug


				const routes2 = await getRoutesWithPoints({
					routeId: route_id,
				});
				console.log('debug routes2', routes2); // debug
			}


		})();
	}, []);

	return undefined;
};

export default DebugBla;
