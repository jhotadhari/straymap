import { eq } from 'drizzle-orm';
import { Feature, Point, GeoJsonProperties } from 'geojson';

import { dbConnection } from '../../dbLoader/DBConnection';
import { routingPointsTable, routesTable } from './schema/schema';
import { fetchRoutes } from './fetch';
import { RoutingProfile } from '../types';
import { withDbErrorHandling, withDbTransaction, parseReturningIds } from '../../dbLoader/utils';

export const createRoutingPoints = withDbErrorHandling(
	'routing/actionsRoutingPoint.createRoutingPoints',
	async (
		newPoints: {
			feature: Feature<Point, GeoJsonProperties>;
			profile: RoutingProfile;
		}[],
		route_id?: number | false
	) => {
		if (!route_id || !dbConnection?.drizzle) {
			return;
		}

		// Fetch existing route data before the transaction so the complex
		// SELECT runs through drizzle (not raw SQL).
		const routes = await fetchRoutes({ routeId: route_id });

		return withDbTransaction(async (exec) => {
			const insertResult = await exec(
				dbConnection
					.drizzle!.insert(routingPointsTable)
					.values(
						newPoints.map(({ feature, profile }) => ({
							route_id: route_id,
							geometry: feature.geometry,
							profile: profile,
						}))
					)
					.returning({ id: routingPointsTable.id })
			);
			const inserted = parseReturningIds(insertResult);

			if (inserted.length !== newPoints.length) {
				return inserted;
			}
			// Append new point IDs to the existing point_order.
			const existingIds = routes.length ? routes[0].points.map((p) => p.id) : [];
			const newOrder = [...existingIds, ...inserted.map((r) => r.id)];

			await exec(
				dbConnection
					.drizzle!.update(routesTable)
					.set({ point_order: newOrder })
					.where(eq(routesTable.id, route_id))
			);

			return inserted;
		});
	}
);

export const updateRoutingPoint = withDbErrorHandling(
	'routing/actionsRoutingPoint.updateRoutingPoint',
	async (
		id: number,
		newPoint: Partial<{
			feature: Feature<Point, GeoJsonProperties>;
			profile?: RoutingProfile;
		}>
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		await dbConnection.drizzle
			.update(routingPointsTable)
			.set({
				...(undefined !== newPoint?.profile && { profile: newPoint.profile }),
				...(undefined !== newPoint?.feature && { geometry: newPoint.feature.geometry }),
			})
			.where(eq(routingPointsTable.id, id));
	}
);

export const deleteRoutingPoint = withDbErrorHandling(
	'routing/actionsRoutingPoint.deleteRoutingPoint',
	async (id?: number) => {
		if (!id || !dbConnection?.drizzle) {
			return;
		}
		const routesToUpdate = await dbConnection
			.drizzle!.select({
				id: routesTable.id,
				point_order: routesTable.point_order,
			})
			.from(routingPointsTable)
			.innerJoin(routesTable, eq(routingPointsTable.route_id, routesTable.id))
			.where(eq(routingPointsTable.id, id));

		// Wrap route point_order updates + the point DELETE in a single
		// transaction so a partial failure doesn't leave stale point_order.
		await withDbTransaction(async (exec) => {
			for (const route of routesToUpdate) {
				const newOrder = route.point_order.filter((pId) => pId !== id);
				await exec(
					dbConnection
						.drizzle!.update(routesTable)
						.set({ point_order: newOrder })
						.where(eq(routesTable.id, route.id))
				);
			}
			await exec(
				dbConnection
					.drizzle!.delete(routingPointsTable)
					.where(eq(routingPointsTable.id, id))
			);
		});
	}
);
