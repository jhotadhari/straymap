import { eq } from 'drizzle-orm';
import { Feature, Point, GeoJsonProperties } from 'geojson';

import { dbZ } from '../../../../db/clients';
import { routingPointsTable } from './schema/schema';
import { fetchRoutes } from './fetch';
import { updateRoute } from './actionsRoute';
import { RoutingProfile } from '../types';

export const createRoutingPoints = async (
	newPoints: {
		feature: Feature<Point, GeoJsonProperties>;
		profile: RoutingProfile;
	}[],
	route_id: number | false,
) => {
	if ( ! route_id ) {
		return;
	}
	try {
		const inserted = await dbZ
			.insert(routingPointsTable)
			.values(
				newPoints.map(({ feature, profile }) => ({
					route_id: route_id,
					geometry: feature.geometry,
					profile: profile,
				}))
			)
			.returning({ id: routingPointsTable.id });

		if (inserted.length !== newPoints.length) {
			return inserted;
		}
		const routes = await fetchRoutes({ routeId: route_id });
		if (!routes.length) {
			return inserted;
		}
		await updateRoute(routes[0].id, {
			point_order: routes[0].points.map((p) => p.id),
		});
		return inserted;
	} catch (error) {
		console.log('debug error', error); // debug
	}
};

export const updateRoutingPoint = async (
	id: number,
	newPoint: Partial<{
		feature: Feature<Point, GeoJsonProperties>;
		profile?: RoutingProfile;
	}>
) => {
	// const routingPoints = await dbZ
	// 	.select()
	// 	.from(routingPointsTable)
	// 	.where(eq(routingPointsTable.id, id))
	// 	.limit(1);
	// if (!routingPoints.length) {
	// 	return;
	// }
	await dbZ
		.update(routingPointsTable)
		.set({
			...(undefined !== newPoint?.profile && { profile: newPoint.profile }),
			...(undefined !== newPoint?.feature && { geometry: newPoint.feature.geometry }),
		})
		.where(eq(routingPointsTable.id, id));
};

export const deleteRoutingPoint = async (id: number) => {
	const routes = await fetchRoutes({ pointId: id });
	await Promise.all(
		routes.map(async (route) => {
			await updateRoute(route.id, {
				point_order: route.point_order.filter((pId) => pId !== id),
			});
		})
	);
	await dbZ.delete(routingPointsTable).where(eq(routingPointsTable.id, id));
};
