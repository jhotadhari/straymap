/**
 * External dependencies
 */
import { eq } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbZ } from '../../../../db/clients';
import { routesTable, routingPointsTable } from './schema/schema';

export const createRoutes = async (
	newRoutes: {
		line_id?: number;
	}[]
) => {
	try {
		const inserted = await dbZ
			.insert(routesTable)
			.values(
				newRoutes.map(({ line_id }) => ({
					line_id: line_id ?? null,
					point_order: [],
				}))
			)
			.returning({ id: routesTable.id });
		return inserted;
	} catch (error) {
		console.log('debug error', error); // debug
	}
};

export const createRoute = async () => {
	const inserted = await createRoutes([{}]);
	if (!inserted?.length) {
		return undefined;
	}
	return inserted[0].id;
};

export const updateRoute = async (
	id: number | false | undefined,
	newRoute: Partial<{
		line_id: number | null;
		point_order: number[];
	}>
) => {
	if (!id || !Object.keys(newRoute).length) {
		return;
	}
	const routes = await dbZ.select().from(routesTable).where(eq(routesTable.id, id)).limit(1);
	if (!routes.length) {
		return;
	}
	await dbZ
		.update(routesTable)
		.set({
			...(undefined !== newRoute?.line_id && { line_id: newRoute.line_id }),
			...(undefined !== newRoute?.point_order && { point_order: newRoute.point_order }),
		})
		.where(eq(routesTable.id, id));
};

export const deleteRoute = async (id?: number | false) => {
	if (id) {
		await dbZ.delete(routingPointsTable).where(eq(routingPointsTable.route_id, id));
		await dbZ.delete(routesTable).where(eq(routesTable.id, id));
	}
};
