/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { isNumber } from 'lodash-es';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Text } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch } from '../../../store/hooks';
import { sharedStyles } from '../../../sharedStyles';
import { setIsRouting } from '../../routing/slice';
import { deleteLines } from '../db/actionsLine';
import {
	cancelLinesQueries,
	cancelLineGeomQueries,
	invalidateLinesQueries,
	invalidateLineGeomQueries,
	invalidateTagsTable,
} from '../db/queryFns';
import { dbConnection } from '../../dbLoader/DBConnection';

const useDeleteLinesCbModal = ({
	deleteIdsOrId,
	routeId,
	routingLineId,
	removeLinesFromMap,
	onSuccess,
	backgroundBlur,
}: {
	deleteIdsOrId?: number | number[];
	routeId?: number | null;
	routingLineId?: number | null;
	removeLinesFromMap: () => void;
	onSuccess?: () => void;
	backgroundBlur?: boolean;
}) => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const buttonPropsSuccess = useButtonProps({ isSuccess: true });
	const buttonPropsDelete = useButtonProps({ isDestructive: true });

	const deleteIds = useMemo(
		() =>
			Array.isArray(deleteIdsOrId)
				? deleteIdsOrId
				: isNumber(deleteIdsOrId)
					? [deleteIdsOrId]
					: [],
		[deleteIdsOrId]
	);

	const includesRoute = useMemo(
		() => routingLineId && deleteIds.includes(routingLineId),
		[deleteIds, routingLineId]
	);

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const mutationOptions: UseMutationOptions<void, Error, number[] | undefined, void> = useMemo(
		() => ({
			mutationFn: (ids?: number[]) => deleteLines(ids),
			onMutate: async () => {
				await cancelLinesQueries(dbConnection.queryClient!);
				await cancelLineGeomQueries(dbConnection.queryClient!);
				if (includesRoute) {
					await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
					await Promise.all(
						deleteIds.map(async (id) => {
							await dbConnection.queryClient!.cancelQueries({
								queryKey: ['routeForLine', id],
							});
						})
					);
				}
			},
			onSuccess: async () => {
				await invalidateLinesQueries(dbConnection.queryClient!);
				await invalidateLineGeomQueries(dbConnection.queryClient!);
				invalidateTagsTable(dbConnection.queryClient!);
				// Close modal.
				handleDismissModal();
				// Call onSuccess (eg LinesTable uncheck lines).
				onSuccess && onSuccess();
			},
		}),
		[
			routeId,
			includesRoute,
			deleteIds,
			handleDismissModal,
			onSuccess,
		]
	);

	const mutation = useMutation(mutationOptions);

	const handleDeleteLines = useCallback(async () => {
		// Maybe unset routing.
		includesRoute && dispatch(setIsRouting(false));
		// remove from map
		removeLinesFromMap();
		// delete lines and uncheck and dismiss modal
		mutation.mutate(deleteIds);
	}, [
		deleteIds,
		includesRoute,
		removeLinesFromMap,
		dispatch,
		mutation,
	]);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				backgroundBlur={backgroundBlur}
				onDismiss={handleDismissModal}
				headerLabel={t('lines.deleteConfirm')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{sprintf(t('lines.deleteConfirmationBody'), deleteIds.length)}</Text>

				<View style={sharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						{...buttonPropsSuccess}
					>
						{t('cancel')}
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleDeleteLines}
						{...buttonPropsDelete}
					>
						{t('lines.delete')}
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		t,
		deleteIds.length,
		modalVisible,
		handleDismissModal,
		buttonPropsSuccess,
		buttonPropsDelete,
		handleDeleteLines,
		backgroundBlur,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
			iconSource: 'delete-outline',
		}),
		[cb, modalNode]
	);
};

export default useDeleteLinesCbModal;
