/**
 * External dependencies
 */
import { useCallback, useContext, useMemo, useState } from 'react';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { createRoute } from '../../db/actionsRoute';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../hooks';
import { setIsRouting } from '../../slice';

const useToggleRouting = ({ routeId }: { routeId?: number }) => {
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

	// Routes and points are persistent — stopping routing only
	// clears the active routing state, it does not delete data.
	// The route lives on in the DB and can be re-loaded later
	// via RowRouting (LineEditModal) or app restore.
	const stopMutationOptions: UseMutationOptions<void> = useMemo(
		() => ({
			mutationFn: async () => {
				expand(false);
				dispatch(setIsRouting(false));
			},
			onMutate: async () => {
				setIsToggling(true);
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[dispatch, expand]
	);
	const stopMutation = useMutation(stopMutationOptions);

	const handleToggleRouting = useCallback(() => {
		if (routeId) {
			stopMutation.mutate();
		} else {
			createRouteMutation.mutate();
		}
	}, [
		routeId,
		createRouteMutation,
		stopMutation,
	]);

	return useMemo(
		() => ({
			isToggling,
			handleToggleRouting,
		}),
		[isToggling, handleToggleRouting]
	);
};

export default useToggleRouting;
