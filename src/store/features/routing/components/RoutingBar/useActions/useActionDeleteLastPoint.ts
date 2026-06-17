/**
 * External dependencies
 */
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../hooks';
import { deleteRoutingPoint } from '../../../db/actionsRoutingPoint';
import { processRouting } from '../../../slice';
import { RoutingPoint } from '../../../types';

const useActionDeleteLastPoint = ({
	points,
	routeId,
}: {
	points?: RoutingPoint[];
	routeId?: number;
}) => {
	const dispatch = useAppDispatch();

	const lastPointId: number | undefined = useMemo(() => {
		return !points?.length ? undefined : points[points.length - 1].id;
	}, [points]);

	const mutationOptions: UseMutationOptions<void, Error, number | undefined, void> = useMemo(
		() => ({
			mutationFn: (id?: number) => deleteRoutingPoint(id),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				dispatch(processRouting());
			},
		}),
		[lastPointId]
	);

	const mutation = useMutation(mutationOptions);

	const cb = useCallback(() => {
		mutation.mutate(lastPointId);
	}, [lastPointId, mutation.mutate]);

	return {
		key: 'deleteLastPoint',
		cb,
		label: 'deleteLastPoint',
		disabled: () => !points || !points.length,
		// leadingIcon: 'delete',
		leadingIcon: 'minus',
	};
};

export default useActionDeleteLastPoint;
