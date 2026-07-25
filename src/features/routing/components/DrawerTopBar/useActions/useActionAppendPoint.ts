/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { useContext, useMemo, useCallback } from 'react';
import { point } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { createRoutingPoints } from '../../../db/actionsRoutingPoint';
import { processRouting } from '../../../slice';
import { RoutingPoint, RoutingProfile } from '../../../types';

import { MapContext } from '../../../../../Context';
import { dbConnection } from '../../../../dbLoader/DBConnection';
import { pointsCoordsAreOverlapping } from '../../../../../lib/utils';
import { selectLastProfiles } from '../../../selectors';

const useActionAppendPoint = ({
	points,
	routeId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
}) => {
	const dispatch = useAppDispatch();

	const lastProfiles = useAppSelector(selectLastProfiles);

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
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
		}),
		[
			dispatch,
			routeId,
		]
	);
	const mutation = useMutation(mutationOptions);

	const getNextProfile = useCallback(() => {
		const lastPoint = points && points.length ? points[points.length - 1] : undefined;
		return lastPoint?.profile ?? lastProfiles.profiles[lastProfiles.provider];
	}, [points, lastProfiles]);

	const cb = useCallback(async () => {
		if (currentMapEventRef?.current?.center) {
			// Ensure points are not overlapping.
			if (
				points &&
				points.length &&
				pointsCoordsAreOverlapping(
					points[points.length - 1].geometry.coordinates,
					currentMapEventRef.current.center
				)
			) {
				return;
			}

			const feature = point([
				currentMapEventRef.current.center[0],
				currentMapEventRef.current.center[1],
				0,
			]);
			mutation.mutate({
				feature,
				profile: getNextProfile(),
			});
		}
	}, [
		getNextProfile,
		currentMapEventRef,
		mutation,
		points,
	]);

	return useMemo(
		() => ({
			key: 'appendPoint',
			cb,
			label: 'routing.appendPoint',
			leadingIcon: 'plus',
		}),
		[cb]
	);
};

export default useActionAppendPoint;
