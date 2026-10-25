/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import { useCallback, useMemo, useRef } from 'react';
import { point } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	createRoutingPoints,
	deleteRoutingPoint,
	updateRoutingPoint,
} from '../db/actionsRoutingPoint';
import { deleteSegments, processRouting, setMovedPointId } from '../slice';
import { selectMovedPointId } from '../selectors';
import { getAdjacentSegmentRecordIds } from '../utils';
import { RoutingPoint } from '../types';
import { dbConnection } from '../../dbLoader/DBConnection';
import { pointsCoordsAreOverlapping } from '../../../lib/utils';

/**
 * Shared waypoint mutations used by both the drawer action hooks and the
 * map context-menu sources. All geometry-taking callbacks accept an
 * explicit [lng, lat] so tap-driven actions (menu) and center-driven
 * actions (drawer) share one implementation.
 *
 * Every mutation follows the canonical pattern:
 * cancel ['route', routeId] → mutate → invalidate ['route', routeId] →
 * dispatch(processRouting(queryClient)).
 *
 * All returned callbacks have STABLE identities: `useMutation` returns a
 * new object every render, so mutations/state are read through refs (see
 * the AGENTS.md useMutation ref pattern). Without this, sources feeding
 * options into a setState loop would re-render infinitely.
 */
const usePointActions = ({ routeId, points }: { routeId?: number; points?: RoutingPoint[] }) => {
	const dispatch = useAppDispatch();
	const movedPointId = useAppSelector(selectMovedPointId);

	const cancelRouteQueries = useCallback(async () => {
		await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
	}, [routeId]);

	const finishRouteMutation = useCallback(async () => {
		await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
		dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
	}, [dispatch, routeId]);

	// ── Append at an explicit position ──────────────────────────────────

	const appendMutationOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{ feature: Feature<Point, GeoJsonProperties> },
		void
	> = useMemo(
		() => ({
			mutationFn: ({ feature }: { feature: Feature<Point, GeoJsonProperties> }) =>
				createRoutingPoints([{ feature }], routeId),
			onMutate: cancelRouteQueries,
			onSuccess: finishRouteMutation,
		}),
		[
			cancelRouteQueries,
			finishRouteMutation,
			routeId,
		]
	);
	const appendMutation = useMutation(appendMutationOptions);

	// ── Cut: insert at index, immediately move the new point ────────────

	const cutMutationOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{ feature: Feature<Point, GeoJsonProperties>; index: number; segmentRecordId: string },
		void
	> = useMemo(
		() => ({
			mutationFn: ({
				feature,
				index,
			}: {
				feature: Feature<Point, GeoJsonProperties>;
				index: number;
			}) => createRoutingPoints([{ feature }], routeId, index),
			onMutate: cancelRouteQueries,
			onSuccess: async (data, variables) => {
				const newPointId = data?.[0]?.id;
				if (newPointId) {
					dispatch(setMovedPointId(newPointId));
				}
				dispatch(deleteSegments([variables.segmentRecordId]));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
			},
		}),
		[
			cancelRouteQueries,
			dispatch,
			routeId,
		]
	);
	const cutMutation = useMutation(cutMutationOptions);

	// ── Drop at an explicit position ────────────────────────────────────

	const dropMutationOptions: UseMutationOptions<
		void,
		Error,
		{ feature: Feature<Point, GeoJsonProperties> },
		void
	> = useMemo(
		() => ({
			mutationFn: ({ feature }: { feature: Feature<Point, GeoJsonProperties> }) => {
				if (!movedPointId) {
					return Promise.resolve();
				}
				return updateRoutingPoint(movedPointId, { feature });
			},
			onMutate: cancelRouteQueries,
			onSuccess: async () => {
				dispatch(setMovedPointId(null));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
		}),
		[
			cancelRouteQueries,
			dispatch,
			movedPointId,
			routeId,
		]
	);
	const dropMutation = useMutation(dropMutationOptions);

	// ── Delete a waypoint ───────────────────────────────────────────────

	const deleteMutationOptions: UseMutationOptions<void, Error, number, void> = useMemo(
		() => ({
			mutationFn: (id: number) => deleteRoutingPoint(id),
			onMutate: cancelRouteQueries,
			onSuccess: async (_data, id) => {
				if (movedPointId === id) {
					dispatch(setMovedPointId(null));
				}
				await finishRouteMutation();
			},
		}),
		[
			cancelRouteQueries,
			dispatch,
			finishRouteMutation,
			movedPointId,
		]
	);
	const deleteMutation = useMutation(deleteMutationOptions);

	// ── Stable callbacks (ref pattern — see the class doc) ──────────────

	// Fresh state/mutation values on every render, read through stable
	// refs by the useCallback([], ...) callbacks below.
	const stateRef = useRef({ routeId, points, movedPointId });
	stateRef.current = { routeId, points, movedPointId };
	const mutationsRef = useRef({ appendMutation, cutMutation, dropMutation, deleteMutation });
	mutationsRef.current = { appendMutation, cutMutation, dropMutation, deleteMutation };

	const appendPointAt = useCallback((lngLat: [number, number]) => {
		const { routeId: routeIdCurrent } = stateRef.current;
		if (!routeIdCurrent) {
			return;
		}
		mutationsRef.current.appendMutation.mutate({
			feature: point([
				lngLat[0],
				lngLat[1],
				0,
			]),
		});
	}, []);

	const cutSegmentAt = useCallback(
		(segmentRecordId: string, nearest: [number, number], index: number) => {
			const { routeId: routeIdCurrent } = stateRef.current;
			if (!routeIdCurrent) {
				return;
			}
			mutationsRef.current.cutMutation.mutate({
				feature: point([
					nearest[0],
					nearest[1],
					0,
				]),
				index,
				segmentRecordId,
			});
		},
		[]
	);

	const movePoint = useCallback(
		(pointId: number) => {
			const { points: pointsCurrent } = stateRef.current;
			if (pointsCurrent) {
				dispatch(deleteSegments(getAdjacentSegmentRecordIds(pointsCurrent, pointId)));
			}
			dispatch(setMovedPointId(pointId));
		},
		[dispatch]
	);

	const dropPointAt = useCallback(
		(lngLat: [number, number]) => {
			const {
				routeId: routeIdCurrent,
				movedPointId: movedPointIdCurrent,
				points: pointsCurrent,
			} = stateRef.current;
			if (!routeIdCurrent || !movedPointIdCurrent) {
				return;
			}
			// Guard against dropping onto another existing waypoint.
			if (
				pointsCurrent?.some(
					(p) =>
						p.id !== movedPointIdCurrent &&
						pointsCoordsAreOverlapping(p.geometry.coordinates, [lngLat[0], lngLat[1]])
				)
			) {
				return;
			}
			if (pointsCurrent) {
				dispatch(
					deleteSegments(getAdjacentSegmentRecordIds(pointsCurrent, movedPointIdCurrent))
				);
			}
			mutationsRef.current.dropMutation.mutate({
				feature: point([
					lngLat[0],
					lngLat[1],
					0,
				]),
			});
		},
		[dispatch]
	);

	const discardMoving = useCallback(() => {
		dispatch(setMovedPointId(null));
		dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
	}, [dispatch]);

	const deletePoint = useCallback((pointId: number) => {
		mutationsRef.current.deleteMutation.mutate(pointId);
	}, []);

	return {
		appendPointAt,
		cutSegmentAt,
		movePoint,
		dropPointAt,
		discardMoving,
		deletePoint,
	};
};

export default usePointActions;
