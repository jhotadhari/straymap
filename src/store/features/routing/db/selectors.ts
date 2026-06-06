import { sql, eq, and } from 'drizzle-orm';

import { dbZ } from '../../../../db/client';
import { routesTable, routingPointsTable } from './schema/schema';
import { sortArrayByOrderArray } from '../../../../lib/utilsGeneral';
import { RoutingProfile } from '../types';

interface RoutesWithPointsParams {
	routeId?: number;
	pointId?: number;
}

interface RouteWithPoints {
	id: number;
	timestamp: string;
	point_order: number[];
	line_id: number | null;
	points: {
		id: number;
		timestamp: string;
		geometryGeoJSON: string;
		profile: RoutingProfile;
	}[];
}

export const getRoutesWithPointsQuery = (params?: RoutesWithPointsParams) => {
	const { routeId, pointId } = params ?? {};

	const query = dbZ
		.select({
			route: {
				id: routesTable.id,
				timestamp: routesTable.timestamp,
				point_order: routesTable.point_order,
				line_id: routesTable.line_id,
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

	query.where(
		and(
			routeId ? eq(routesTable.id, routeId) : undefined,
			pointId ? eq(routingPointsTable.id, pointId) : undefined
		)
	);

	return query;
};

export interface AggregateRow {
	route: {
		id: number;
		timestamp: string;
		point_order: number[];
		line_id: number | null;
	};
	point: {
		id: number;
		timestamp: string;
		geometryGeoJSON: string;
		profile: RoutingProfile;
	} | null;
};

export const routesWithPointsAggregate = (
	rows: AggregateRow[]
) => {
	const aggregated = Object.values(
		rows.reduce<Record<number, RouteWithPoints>>((acc, row) => {
			if (row?.route?.id && !acc[row.route.id]) {
				acc[row.route.id] = {
					...row.route,
					points: [],
				};
			}
			if (row?.point && row?.route?.id) {
				acc[row.route.id].points.push(row.point);
			}
			return acc;
		}, {})
	);

	aggregated.forEach((row) => {
		sortArrayByOrderArray(row.points, row.point_order, 'id', true);
	});

	return aggregated;
};

export const getRoutesWithPoints = (params?: RoutesWithPointsParams) => {
	return new Promise<RouteWithPoints[]>((resolve) => {
		const query = getRoutesWithPointsQuery(params);
		query
			.all() /// ??? add limit. if routeID or pointID limit 1
			.then((rows) => {
				const aggregated = routesWithPointsAggregate(rows);
				resolve(aggregated);
			});
	});
};
