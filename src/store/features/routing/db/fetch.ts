/**
 * External dependencies
 */
import { and, eq, sql } from 'drizzle-orm';
import { Point } from 'geojson';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { routesTable, routingPointsTable } from './schema/schema';
import { sortArrayByOrderArray } from '../../../../lib/utilsLight';
import { Route } from '../types';
import { rowParseGeometryGeoJSON } from '../../dbLoader/utils';
import { linesTable } from '../../lines/db/schema/schema';
import { mapValues, pick } from 'lodash-es';
import { STATS_FIELDS } from '../../lines/types';

/**
 * Functions to fetch/retrieve data from database.
 * They are actually db selectors or drizzle queries. But to avoid naming collisions, let's call/prefix them "fetch".
 *
 */
/**
 */

export interface FetchRoutesParams {
	routeId?: number | false;
	pointId?: number;
	lineId?: number;
}

const statsFields = [...STATS_FIELDS] as string[];

export const fetchRoutes = (params?: FetchRoutesParams): Promise<Route[]> => {
	const { routeId, pointId, lineId } = params ?? {};

	if (false === routeId || !dbConnection?.drizzle) {
		return Promise.resolve([]);
	}

	// Flat query (not RQB) — linesTable.geometry is directly joined so
	// SpatiaLite functions can reference it, while the geometry BLOB
	// never enters any json_array() subquery.
	const query = dbConnection.drizzle
		.select({
			// Point fields
			pointId: routingPointsTable.id,
			pointTimestamp: routingPointsTable.timestamp,
			geometryGeoJSON:
				sql<string>`AsGeoJSON (${routingPointsTable.geometry})`,
			pointProfile: routingPointsTable.profile,

			// Route fields
			routeId: routesTable.id,
			routeTimestamp: routesTable.timestamp,
			routePointOrder: routesTable.point_order,
			routeLineId: routesTable.line_id,

			// Spatial stats from linesTable.geometry (flat join —
			// geometry BLOB never enters a json_array() subquery)
			length:
				sql<string>`GreatCircleLength (${linesTable.geometry})`,
			uphill:
				sql<string>`UphillHeight (${linesTable.geometry})`,
			downhill:
				sql<string>`DownhillHeight (${linesTable.geometry})`,
			minZ: sql<string>`ST_MinZ (${linesTable.geometry})`,
			maxZ: sql<string>`ST_MaxZ (${linesTable.geometry})`,
		})
		.from(routingPointsTable)
		.leftJoin(
			routesTable,
			eq(routingPointsTable.route_id, routesTable.id)
		)
		.leftJoin(linesTable, eq(routesTable.line_id, linesTable.id))
		.where(
			and(
				routeId
					? eq(routingPointsTable.route_id, routeId)
					: undefined,
				pointId
					? eq(routingPointsTable.id, pointId)
					: undefined,
				lineId
					? eq(routesTable.line_id, lineId)
					: undefined
			)
		);

	return query.then((rows) => {
		// When querying by routeId, a route with zero points produces
		// zero rows (the leftJoin produces nothing).  Fall back to a
		// direct route lookup so callers know the route exists.
		if (!rows.length && routeId) {
			return dbConnection
				.drizzle!.select({
					id: routesTable.id,
					timestamp: routesTable.timestamp,
					point_order: routesTable.point_order,
					line_id: routesTable.line_id,
				})
				.from(routesTable)
				.where(eq(routesTable.id, routeId as number))
				.limit(1)
				.then((routes) =>
					routes.map(
						(r): Route => ({
							...r,
							stats: {},
							points: [],
						})
					)
				);
		}

		// Same fallback for lineId queries — a route with zero points
		// is invisible through the routingPointsTable left join.
		if (!rows.length && lineId) {
			return dbConnection
				.drizzle!.select({
					id: routesTable.id,
					timestamp: routesTable.timestamp,
					point_order: routesTable.point_order,
					line_id: routesTable.line_id,
				})
				.from(routesTable)
				.where(eq(routesTable.line_id, lineId))
				.limit(1)
				.then((routes) =>
					routes.map(
						(r): Route => ({
							...r,
							stats: {},
							points: [],
						})
					)
				);
		}

		// Aggregate flat rows back into routes.
		const aggregated = Object.values(
			rows.reduce<Record<number, Route>>((acc, row) => {
				const rId = row.routeId;
				if (rId && !acc[rId]) {
					acc[rId] = {
						id: rId,
						timestamp: row.routeTimestamp,
						point_order: row.routePointOrder,
						line_id: row.routeLineId,
						stats: mapValues(
							pick(
								row,
								statsFields
							) as Record<string, string>,
							(str: string) => parseFloat(str)
						),
						points: [],
					} as Route;
				}
				if (rId && row.pointId) {
					const pointFields = {
						id: row.pointId,
						timestamp: row.pointTimestamp,
						geometryGeoJSON: row.geometryGeoJSON,
						profile: row.pointProfile,
					};
					acc[rId].points.push(
						rowParseGeometryGeoJSON<
							typeof pointFields,
							Point
						>(pointFields)
					);
				}
				return acc;
			}, {})
		);

		aggregated.forEach((route) => {
			sortArrayByOrderArray(
				route.points,
				route.point_order,
				'id',
				true
			);
		});

		return aggregated;
	});
};
