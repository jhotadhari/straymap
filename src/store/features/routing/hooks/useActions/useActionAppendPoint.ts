import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { useContext, useMemo, useCallback } from 'react';
import { point } from '@turf/turf';

import { useAppDispatch } from '../../../../hooks';
import { createRoutingPoints } from '../../db/actionsRoutingPoint';
import { processRouting } from '../../slice';
import { RoutingPoint, RoutingProfile } from '../../types';
import { MapContext } from '../../../../../Context';

const useActionAppendPoint = ({
	points,
	routeId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
}) => {
	const dispatch = useAppDispatch();

	const { currentMapEventRef } = useContext(MapContext);

	const mutationOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{
			feature: Feature<Point, GeoJsonProperties>;
			profile: RoutingProfile;
		},
		void
	> = useMemo(
		() => ({
			mutationFn: ({
				feature,
				profile,
			}: {
				feature: Feature<Point, GeoJsonProperties>;
				profile: RoutingProfile;
			}) =>
				createRoutingPoints(
					[
						{
							feature,
							profile,
						},
					],
					routeId
				),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				dispatch(processRouting());
			},
		}),
		[routeId]
	);
	const mutation = useMutation(mutationOptions);

	const getNextProfile = useCallback(() => {
		const lastPoint = points && points.length ? points[points.length - 1] : undefined;
		return {
			fast: lastPoint?.profile?.fast ?? true, // ??? from defaults, or from previous or from cut segment
			v: lastPoint?.profile?.v ?? 'motorcar', // ??? from defaults, or from previous or from cut segment
		};
	}, [points]);

	const cb = useCallback(async () => {
		if (currentMapEventRef?.current?.center) {
			const feature = point([
				currentMapEventRef?.current?.center.lng,
				currentMapEventRef?.current?.center.lat,
				0,
			]);
			mutation.mutate({
				feature,
				profile: getNextProfile(),
			});
		}
	}, [getNextProfile, mutation.mutate]);

	return {
		key: 'appendPoint',
		cb,
		label: 'appendPoint',
		leadingIcon: 'plus',
	};
};

export default useActionAppendPoint;
