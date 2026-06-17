import { Route } from '../types';
import { fetchRoutes } from './fetch';

/**
 * Functions to be used by react query client as queryFn:
 *	- Wrappers for the db fetch functions.
 *	- get their args from queryKey,
 */
/**
 */

/**
 *
 * Used with:
 *
 * 	queryKey: ['route', routeId],
 */
export const queryRoute = ({ queryKey }: { queryKey: (string | number | false)[] }) => {
	if (queryKey.length < 2) {
		return Promise.resolve(null);
	}
	const [_key, routeId] = queryKey;
	return new Promise<Route | null>((resolve, reject) => {
		if (!routeId) {
			return resolve(null);
		}
		fetchRoutes({
			routeId: routeId as number | false,
		})
			.then((routes) => {
				resolve(routes.length ? routes[0] : null);
			})
			.catch((error) => {
				reject(error);
			});
	});
};

/**
 *
 * ??? Better to unify this with queryRoute
 *
 * Used with:
 *
 * 	queryKey: ['routeForLine', lineId],
 */
export const queryRouteForLine = ({ queryKey }: { queryKey: (string | number | undefined)[] }) => {
	if (queryKey.length < 2) {
		return Promise.resolve(null);
	}
	const [_key, lineId] = queryKey;
	return new Promise<Route | null>((resolve, reject) => {
		if (!lineId || 'string' === typeof lineId) {
			return resolve(null);
		}
		fetchRoutes({
			lineId,
		})
			.then((routes) => {
				resolve(routes.length ? routes[0] : null);
			})
			.catch((error) => {
				reject(error);
			});
	});
};
