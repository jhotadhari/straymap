/**
 * External dependencies
 */
import { sql, eq, and } from 'drizzle-orm';
import { Point } from 'geojson';

/**
 * Internal dependencies
 */
import { dbZ } from '../../../../db/clients';
import { routesTable, routingPointsTable } from './schema/schema';
import { sortArrayByOrderArray } from '../../../../lib/utilsLight';
import { Route } from '../types';
import { rowParseGeometryGeoJSON } from '../../../../db/utils';
import { linesTable } from '../../lines/db/schema/schema';
import { mapValues, omit, pick } from 'lodash-es';
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

export const fetchRoutes = (params?: FetchRoutesParams) => {
	return new Promise<Route[]>((resolve, reject) => {
		const { routeId, pointId, lineId } = params ?? {};

		if (false === routeId) {
			return [];
		}

		const query = dbZ
			.select({
				route: {
					id: routesTable.id,
					timestamp: routesTable.timestamp,
					point_order: routesTable.point_order,
					line_id: routesTable.line_id,
					length: sql<string>`GreatCircleLength (${linesTable.geometry})`,
					uphill: sql<string>`UphillHeight (${linesTable.geometry})`,
					downhill: sql<string>`DownhillHeight (${linesTable.geometry})`,
					minZ: sql<string>`ST_MinZ (${linesTable.geometry})`,
					maxZ: sql<string>`ST_MaxZ (${linesTable.geometry})`,
				},
				point: {
					id: routingPointsTable.id,
					timestamp: routingPointsTable.timestamp,
					geometryGeoJSON: sql<string>`AsGeoJSON (${routingPointsTable.geometry})`,
					profile: routingPointsTable.profile,
				},
			})
			.from(routesTable);

		query.leftJoin(routingPointsTable, eq(routingPointsTable.route_id, routesTable.id));

		query.leftJoin(linesTable, eq(linesTable.id, routesTable.line_id));

		query.where(
			and(
				routeId ? eq(routesTable.id, routeId) : undefined,
				pointId ? eq(routingPointsTable.id, pointId) : undefined,
				lineId ? eq(routesTable.line_id, lineId) : undefined
			)
		);

		query
			.all()
			.then((rows) => {
				const aggregated = Object.values(
					rows.reduce<Record<number, Route>>((acc, row) => {
						if (row?.route?.id && !acc[row.route.id]) {
							acc[row.route.id] = {
								...omit(row.route, statsFields),
								stats: mapValues(pick(row.route, statsFields), (str: string) =>
									parseFloat(str)
								),
								points: [],
							} as Route;
						}
						if (row?.point && row?.route?.id) {
							acc[row.route.id].points.push(
								rowParseGeometryGeoJSON<typeof row.point, Point>(row.point)
							);
						}
						return acc;
					}, {})
				);

				aggregated.forEach((row) => {
					sortArrayByOrderArray(row.points, row.point_order, 'id', true);
				});

				resolve(aggregated);
			})
			.catch((err) => {
				reject(err);
			});
	});
};
