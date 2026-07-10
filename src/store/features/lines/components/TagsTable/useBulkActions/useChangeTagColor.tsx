/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { updateTag } from '../../../db/actionsTag';
import { logError } from '../../../../../../lib/utils';
import { ErrorToastContext } from '../../../../../../components/ErrorToast/Context';
import { sprintf } from 'sprintf-js';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import ColorPaletteInline from '../ColorPaletteInline';
import { TAG_COLORS } from '../../tagColor';
import { sharedStyles } from '../sharedDeps';

const useChangeTagColor = () => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const { checkedIds, setCheckedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].bg);

	const mutation = useMutation({
		mutationFn: async (color: string) => {
			for (const tagId of checkedIds) {
				await updateTag(tagId, { data: { color } });
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tagsTable'] });
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			queryClient.refetchQueries({ queryKey: ['tagsTable'] });
			setCheckedIds?.([]);
			setModalVisible(false);
		},
		onError: (err) => {
			logError('useChangeTagColor', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const openModal = useCallback(() => {
		setSelectedColor(TAG_COLORS[0].bg);
		setModalVisible(true);
	}, []);

	const closeModal = useCallback(() => {
		if (mutation.isPending) return;
		setModalVisible(false);
	}, [mutation.isPending]);

	const handleApply = useCallback(() => {
		mutation.mutate(selectedColor);
	}, [mutation, selectedColor]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const modalNode = useMemo(
		() => (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={closeModal}
				header={t('lines.tagsChangeColor')}
				innerStyle={sharedStyles.modalInner}
			>
				<ColorPaletteInline
					selectedColor={selectedColor}
					onSelect={setSelectedColor}
				/>
				<ButtonHighlight
					onPress={handleApply}
					mode="contained"
					disabled={mutation.isPending}
				>
					<Text>{t('lines.tagsApply')}</Text>
				</ButtonHighlight>
			</ModalWrapper>
		),
		[
			modalVisible,
			closeModal,
			selectedColor,
			handleApply,
			mutation.isPending,
			t,
		]
	);

	return useMemo(
		() => ({
			key: 'changeTagColor',
			cb: openModal,
			label: 'lines.tagsChangeColor',
			leadingIcon: 'palette-outline',
			modalNode,
			disabled,
		}),
		[
			openModal,
			modalNode,
			disabled,
		]
	);
};

export default useChangeTagColor;
