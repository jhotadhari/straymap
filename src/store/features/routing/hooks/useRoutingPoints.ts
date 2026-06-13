/**
 * External dependencies
 */
import { useQuery } from "@tanstack/react-query";

/**
 * Internal dependencies
 */
import { useAppSelector } from "../../../hooks";
import { queryRoutes } from "../db/queries";
import { selectIsRouting } from "../selectors";

const useRoutingPoints = () => {
    const routeId = useAppSelector(selectIsRouting);
    const { data: routePoints } = useQuery({
        queryKey: ['routes', routeId],
        queryFn: () => queryRoutes({ routeId: routeId }),
        select: (routes) => routes.map((route) => route.points),
    });
    const points = routePoints?.length ? routePoints[0] : [];
    return points;
};

export default useRoutingPoints;