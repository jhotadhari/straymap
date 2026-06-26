/**
 * External dependencies
 */
import { eq } from 'drizzle-orm';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { routesTable, routingPointsTable } from './schema/schema';
import { logError } from '../../../../lib/utils';
import { showErrorToast } from '../../../../components/ErrorToast/service';
import i18n from '../../../../assets/i18n/i18n';

export const createRoutes = async (
	newRoutes: {
		line_id?: number;
	}[]
) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	try {
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
	} catch (error) {
		logError('routing/actionsRoute.createRoutes', error);
		showErrorToast(sprintf(i18n.t('errorGeneric'), (error as Error)?.message ?? String(error)));
		throw error;
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
};

export const deleteRoute = async (id?: number | false) => {
	if (id && dbConnection?.drizzle) {
		await dbConnection.drizzle
			.delete(routingPointsTable)
			.where(eq(routingPointsTable.route_id, id));
		await dbConnection.drizzle.delete(routesTable).where(eq(routesTable.id, id));
	}
};
