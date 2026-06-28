/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { get, isNumber } from 'lodash-es';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch } from '../../../hooks';
import { sharedStyles } from '../../../../sharedStyles';
import { setIsRouting } from '../../routing/slice';
import { deleteLines } from '../db/actionsLine';
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

	const theme = useTheme();

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
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['lines'] });
				await Promise.all(
					deleteIds.map(async (id) => {
						await dbConnection.queryClient!.cancelQueries({
							queryKey: ['lineGeom', id],
						});
					})
				);
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
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['lines'] });
				// Close modal.
				handleDismissModal();
				// Call onSuccess (eg LinesTable uncheck lines).
				onSuccess && onSuccess();

				// ??? maybe unexpand drawer with routing if was active
				// ??? maybe unexpand drawer with lines if was active and no lines anymore
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
				header={'really delete???'}
				innerStyle={sharedStyles.modal}
			>
				<Text>
					{sprintf(
						'???are you really sure to delete %s lines and any corresponding data. This can not be undone',
						deleteIds.length
					)}
				</Text>

				<View style={sharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('???back')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleDeleteLines}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('???delete')}</Text>
					</ButtonHighlight>
				</View>
			</ModalWrapper>
		);
	}, [
		t,
		deleteIds.length,
		modalVisible,
		handleDismissModal,
		theme,
		handleDeleteLines,
		backgroundBlur,
	]);

	return {
		cb,
		modalNode,
		iconSource: 'delete',
	};
};

export default useDeleteLinesCbModal;
