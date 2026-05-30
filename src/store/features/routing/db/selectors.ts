import { sql, eq, and } from 'drizzle-orm';

import { dbZ } from '../../../../db/client';
import { routesTable, routingPointsTable } from './schema/schema';
import { sortArrayByOrderArray } from '../../../../lib/utilsGeneral';

export const getRoutesWithPoints = (params?: {
	routeId?: number;
	pointId?: number;
}) => {
	const { routeId, pointId } = params ?? {};

	return new Promise<
		{
			id: number;
			timestamp: string;
			point_order: number[];
			line_id: number | null;
			points: {
				id: number;
				timestamp: string;
				geometryGeoJSON: string;
				profile: any; // ??? any
			}[];
		}[]
	>((resolve) => {
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

		query
			.where(
				and(
					routeId ? eq(routesTable.id, routeId) : undefined,
					pointId ? eq(routingPointsTable.id, pointId) : undefined
				)
			)
			.all()	/// ??? add limit. if routeID or pointID limit 1
			.then((rows) => {
				const aggregated = Object.values(
					rows.reduce<
						Record<
							number,
							{
								id: number;
								timestamp: string;
								point_order: number[];
								line_id: number | null;
								points: {
									id: number;
									timestamp: string;
									geometryGeoJSON: string;
									profile: any; // ??? any
								}[];
							}
						>
					>((acc, row) => {
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

				resolve(aggregated);
			});
	});
};
