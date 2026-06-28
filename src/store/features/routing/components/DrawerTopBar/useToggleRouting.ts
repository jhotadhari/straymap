/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { createRoute, deleteRoute } from '../../db/actionsRoute';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../hooks';
import { setIsRouting } from '../../slice';
import { dbConnection } from '../../../dbLoader/DBConnection';

const useToggleRouting = ({
	routeId,
}: {
	routeId?: number;
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
			mutationFn: () => deleteRoute(routeId),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
				setIsToggling(true);
			},
			onSuccess: async () => {
				expand(false);
				dispatch(setIsRouting(false));
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[
			dispatch,
			routeId,
			expand,
		]
	);
	const deleteMutation = useMutation(deleteMutationOptions);

	const handleToggleRouting = useCallback(() => {
		if (routeId) {
			deleteMutation.mutate();
		} else {
			createRouteMutation.mutate();
		}
	}, [
		routeId,
		createRouteMutation,
		deleteMutation,
	]);

	return {
		isToggling,
		handleToggleRouting,
	};
};

export default useToggleRouting;
