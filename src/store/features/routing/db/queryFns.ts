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
	const [_key, routeId] = queryKey;
	return new Promise<Route | null>((resolve, reject) => {
		if (!routeId) {
			resolve(null);
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
