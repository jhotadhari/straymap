/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { queryRoute } from '../db/queryFns';
import { selectIsRouting } from '../selectors';
import { Route } from '../types';

const useRoute = (fields?: (keyof Route)[]) => {
	const routeId = useAppSelector(selectIsRouting);
	const { data: route } = useQuery({
		queryKey: ['route', routeId],
		queryFn: queryRoute,
		...(fields &&
			fields.length && {
				select: (route: Route | null) => (route ? pick<Route>(route, fields) : null),
			}),
	});
	return route;
};

export default useRoute;
