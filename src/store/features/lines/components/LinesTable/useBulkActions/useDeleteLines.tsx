/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { get, uniq } from 'lodash-es';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { deleteLines } from '../../../db/actionsLine';
import { useAppDispatch } from '../../../../../hooks';
import { setIsRouting } from '../../../../routing/slice';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import { stylesGeneric } from '../../../../baseMap/components/controls/layers/LayersControl';

const useDeleteLines = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId, routeId, setCheckedIds } =
		useContext(FooterContext);

	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const theme = useTheme();

	const includesRoute = useMemo(
		() => routingLineId && checkedIds.includes(routingLineId),
		[checkedIds, routingLineId]
	);

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const mutationOptions: UseMutationOptions<void, Error, number[] | undefined, void> = useMemo(
		() => ({
			mutationFn: (ids?: number[]) => deleteLines(ids),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['lines'] });
				await Promise.all(
					checkedIds.map(async (id) => {
						await context.client.cancelQueries({ queryKey: ['lineGeom', id] });
					})
				);
				if (includesRoute) {
					await context.client.cancelQueries({ queryKey: ['route', routeId] });
					await Promise.all(
						checkedIds.map(async (id) => {
							await context.client.cancelQueries({ queryKey: ['routeForLine', id] });
						})
					);
				}
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['lines'] });

				// Uncheck lines.
				setCheckedIds && setCheckedIds([]);
				// close modal
				handleDismissModal();
			},
		}),
		[
			routeId,
			includesRoute,
			checkedIds,
		]
	);

	const mutation = useMutation(mutationOptions);

	const handleDeleteCheckedLines = useCallback(async () => {
		// Maybe unset routing.
		includesRoute && dispatch(setIsRouting(false));
		// remove from map temp
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...checkedIds]);
			});
		// delete lines and uncheck and dismiss modal
		mutation.mutate(checkedIds);
	}, [
		checkedIds,
		includesRoute,
		setOnMapIdsTemp,
		mutation.mutate,
	]);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={handleDismissModal}
				header={'realy delete???'}
				innerStyle={stylesGeneric.modal}
			>
				<Text>
					{sprintf(
						'???are you really sure to delete %s lines and any corresponding data. This can not be undone',
						checkedIds.length
					)}
				</Text>

				<View style={stylesGeneric.modalControls}>
					<ButtonHighlight
						onPress={handleDismissModal}
						mode="contained"
						buttonColor={get(theme.colors, 'successContainer')}
						textColor={get(theme.colors, 'onSuccessContainer')}
					>
						<Text>{t('???back')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handleDeleteCheckedLines}
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
		checkedIds.length,
		modalVisible,
		handleDismissModal,
		theme,
		handleDeleteCheckedLines,
	]);

	return {
		key: 'deleteLines',
		cb,
		label: 'deleteLines',
		leadingIcon: 'delete',
		modalNode,
	};
};

export default useDeleteLines;
