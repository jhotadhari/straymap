/**
 * External dependencies
 */
import { and, eq } from 'drizzle-orm';
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

	// RQB (relational query builder) handles the one-to-many join →
	// nest for routes→points, replacing the manual .reduce() into
	// Record<routeId, Route>.  extras injects the SpatiaLite function
	// calls that can't be expressed via the ORM alone.
	return dbConnection.drizzle.query.routingPointsTable
		.findMany({
			extras: (_table, { sql: s }) => ({
				geometryGeoJSON: s<string>`AsGeoJSON (${routingPointsTable.geometry})`.as(
					'geometryGeoJSON'
				),
				length: s<string>`GreatCircleLength (${linesTable.geometry})`.as('length'),
				uphill: s<string>`UphillHeight (${linesTable.geometry})`.as('uphill'),
				downhill: s<string>`DownhillHeight (${linesTable.geometry})`.as('downhill'),
				minZ: s<string>`ST_MinZ (${linesTable.geometry})`.as('minZ'),
				maxZ: s<string>`ST_MaxZ (${linesTable.geometry})`.as('maxZ'),
			}),
			with: {
				route: {
					with: {
						line: true,
					},
				},
			},
			where: and(
				routeId ? eq(routesTable.id, routeId) : undefined,
				pointId ? eq(routingPointsTable.id, pointId) : undefined,
				lineId ? eq(routesTable.line_id, lineId) : undefined
			),
		})
		.then((rows) => {
			// Aggregate flat rows back into routes (RQB nested the line
			// inside route but the base is still per-point).
			const aggregated = Object.values(
				rows.reduce<Record<number, Route>>((acc, row) => {
					const routeData = row.route;
					if (routeData?.id && !acc[routeData.id]) {
						acc[routeData.id] = {
							id: routeData.id,
							timestamp: routeData.timestamp,
							point_order: routeData.point_order,
							line_id: routeData.line_id,
							stats: mapValues(
								pick(row, statsFields) as Record<string, string>,
								(str: string) => parseFloat(str)
							),
							points: [],
						} as Route;
					}
					if (routeData?.id) {
						acc[routeData.id].points.push(
							rowParseGeometryGeoJSON<typeof row, Point>(row)
						);
					}
					return acc;
				}, {})
			);

			aggregated.forEach((route) => {
				sortArrayByOrderArray(route.points, route.point_order, 'id', true);
			});

			return aggregated;
		});
};
