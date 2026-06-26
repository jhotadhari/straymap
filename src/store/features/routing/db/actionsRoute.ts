/**
 * External dependencies
 */
import { eq } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { routesTable, routingPointsTable } from './schema/schema';
import { withDbErrorHandling, withDbTransaction } from '../../dbLoader/utils';

export const createRoutes = withDbErrorHandling(
	'routing/actionsRoute.createRoutes',
	async (
		newRoutes: {
			line_id?: number;
		}[]
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		const inserted = await dbConnection.drizzle
			.insert(routesTable)
			.values(
				newRoutes.map(({ line_id }) => ({
					line_id: line_id ?? null,
					point_order: [],
				}))
			)
			.returning({ id: routesTable.id });
		return inserted;
	}
);

export const createRoute = async () => {
	const inserted = await createRoutes([{}]);
	if (!inserted?.length) {
		return undefined;
	}
	return inserted[0].id;
};

export const updateRoute = withDbErrorHandling(
	'routing/actionsRoute.updateRoute',
	async (
		id: number | false | undefined,
		newRoute: Partial<{
			line_id: number | null;
			point_order: number[];
		}>
	) => {
		if (!id || !dbConnection?.drizzle || !Object.keys(newRoute).length) {
			return;
		}
		const routes = await dbConnection.drizzle
			.select()
			.from(routesTable)
			.where(eq(routesTable.id, id))
			.limit(1);
		if (!routes.length) {
			return;
		}
		await dbConnection.drizzle
			.update(routesTable)
			.set({
				...(undefined !== newRoute?.line_id && { line_id: newRoute.line_id }),
				...(undefined !== newRoute?.point_order && { point_order: newRoute.point_order }),
			})
			.where(eq(routesTable.id, id));
	}
);

export const deleteRoute = withDbErrorHandling(
	'routing/actionsRoute.deleteRoute',
	async (id?: number | false) => {
		if (id && dbConnection?.drizzle) {
			await withDbTransaction(async (exec) => {
				await exec(
					dbConnection.drizzle!
						.delete(routingPointsTable)
						.where(eq(routingPointsTable.route_id, id))
				);
				await exec(
					dbConnection.drizzle!.delete(routesTable).where(eq(routesTable.id, id))
				);
			});
		}
	}
);
