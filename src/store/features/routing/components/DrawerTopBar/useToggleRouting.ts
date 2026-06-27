/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { createRoute, deleteRoute } from '../../db/actionsRoute';
import { deleteLine } from '../../../lines/db/actionsLine';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../hooks';
import { setIsRouting } from '../../slice';

const useToggleRouting = ({
	pointIds,
	routeId,
	routingLineId,
}: {
	pointIds?: number[];
	routeId?: number;
	routingLineId?: number | null;
}) => {
	const { expand } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const [isToggling, setIsToggling] = useState(false);

	const createMutationOptions: UseMutationOptions<number | undefined> = useMemo(
		() => ({
			mutationFn: createRoute,
			onMutate: async () => {
				setIsToggling(true);
			},
			onSuccess: async (newRouteId) => {
				if (newRouteId) {
					dispatch(setIsRouting(newRouteId));
					expand(0.35);
				}
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[dispatch, expand]
	);
	const createRouteMutation = useMutation(createMutationOptions);

	const deleteMutationOptions: UseMutationOptions = useMemo(
		() => ({
			mutationFn: () =>
				Promise.all([
					deleteRoute(routeId),
					deleteLine(routingLineId || false),
				]),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
				await context.client.cancelQueries({ queryKey: ['lines'] });
				await context.client.cancelQueries({ queryKey: ['lineGeom', routingLineId] });
				setIsToggling(true);
			},
			onSuccess: async (_, _variables, _onMutateResult, context) => {
				expand(false);
				dispatch(setIsRouting(false));
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				await context.client.invalidateQueries({ queryKey: ['lines'] });
				await context.client.invalidateQueries({ queryKey: ['lineGeom', routingLineId] });
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[
			dispatch,
			routeId,
			routingLineId,
			expand,
		]
	);
	const deleteMutation = useMutation(deleteMutationOptions);

	const handleToggleRouting = useCallback(() => {
		if (routeId) {
			if (!pointIds || pointIds.length < 2) {
				deleteMutation.mutate();
			} else {
				expand(false);
				dispatch(setIsRouting(false));
			}
		} else {
			createRouteMutation.mutate();
		}
	}, [
		routeId,
		pointIds,
		createRouteMutation,
		deleteMutation,
		dispatch,
		expand,
	]);

	return {
		isToggling,
		handleToggleRouting,
	};
};

export default useToggleRouting;
