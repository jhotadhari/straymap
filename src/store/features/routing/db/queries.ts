import { fetchRoutesWithPoints } from './fetch';

/**
 * Functions to be used by react query:
 * Wrappers for the db fetch functions.
 *
 */
/**
 */


/**
 *
 * Used with:
 *  queryKey: ['routingLineId', routeId],
 */
export const queryRoutingLineId = async (routeId?: number | false) => {
	if (routeId) {
		const routes = await fetchRoutesWithPoints({ routeId });
		if (routes.length) {
			return routes[0].line_id || null;
		}
	}
	return null;
};
