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
import { dbConnection } from '../../../../dbLoader/DBConnection';

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

	const cb = useCallback(() => {
		mutation.mutate(lastPointId);
	}, [lastPointId, mutation]);

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
