/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { get } from 'lodash-es';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { LinePartial } from '../../types';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import { updateLine } from '../../db/actionsLine';
import { queryRouteForLine } from '../../../routing/db/queryFns';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { LineEditModalContext } from './Context';
import { sharedStyles } from './sharedDeps';
import { dbConnection } from '../../../dbLoader/DBConnection';
import RowDelete from './RowDelete';
import RowName from './RowName';
import RowRouting from './RowRouting';
import RowExport from './RowExport';
import RowStats from './RowStats';
import RowFlyTo from './RowFlyTo';
import RowToggleOnMap from './RowToggleOnMap';

const LineEditModal: FC<{
	selectLine: (id: number, isSelected: boolean) => void;
	onDeleteSuccess?: (lineId?: number) => void;
}> = ({ selectLine, onDeleteSuccess }) => {
	const dispatch = useAppDispatch();

	const lineTemp = useAppSelector(selectLineTemp);

	const lineId = lineTemp?.id;
	const hasLineId = typeof lineId === 'number';

	const { data: route } = useQuery({
		queryKey: ['routeForLine', lineId],
		queryFn: queryRouteForLine,
		enabled: hasLineId,
	});

	const { data: line } = useQuery({
		queryKey: ['lines', hasLineId ? [lineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: hasLineId,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const mutationOptions: UseMutationOptions<void, Error, LinePartial, unknown> = useMemo(
		() => ({
			mutationFn: (newLinePartial: LinePartial) =>
				updateLine(newLinePartial?.id, newLinePartial),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await dbConnection.queryClient!.cancelQueries({
						queryKey: ['route', route?.id],
					});
				}
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await dbConnection.queryClient!.invalidateQueries({
						queryKey: ['route', route?.id],
					});
				}
			},
			onSettled: () => {
				dispatch(setLineTemp(undefined));
			},
		}),
		[dispatch, route?.id]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (
			line &&
			lineTemp &&
			Object.keys(lineTemp).some((key: string) => get(line, key) !== get(lineTemp, key))
		) {
			mutation.mutate(lineTemp);
		} else {
			dispatch(setLineTemp(undefined));
		}
	}, [
		dispatch,
		mutation,
		line,
		lineTemp,
	]);

	const contextValue = useMemo(
		() => ({
			selectLine,
			line,
			route,
			onDismiss,
			onDeleteSuccess,
		}),
		[
			selectLine,
			line,
			route,
			onDismiss,
			onDeleteSuccess,
		]
	);

	return (
		<ModalWrapper
			visible={!!lineTemp}
			onDismiss={onDismiss}
			header={'line???'}
			innerStyle={sharedStyles.modalInner}
		>
			<LineEditModalContext.Provider value={contextValue}>
				<RowName />

				<RowFlyTo />

				<RowToggleOnMap />

				<RowRouting />

				<RowStats />

				<RowExport />

				<RowDelete />
			</LineEditModalContext.Provider>
		</ModalWrapper>
	);
};

export default LineEditModal;
