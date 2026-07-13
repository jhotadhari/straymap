/**
 * External dependencies
 */
import { useContext, useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { updateTag } from '../../../db/actionsTag';
import { invalidateTagsTable } from '../../../db/queryFns';
import { logError } from '../../../../../lib/utils';
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';
import { sprintf } from 'sprintf-js';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import ColorPaletteInline from '../../../../../components/ColorPalette/ColorPaletteInline';
import { PALETTE_COLORS } from '../../tagColor';
import { tableStyles } from '../../tableStyles';

const useChangeTagColor = () => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const { checkedIds, setCheckedIds } = useContext(FooterContext);
	const queryClient = useQueryClient();

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0].bg);

	const mutation = useMutation({
		mutationFn: async (color: string) => {
			for (const tagId of checkedIds) {
				await updateTag(tagId, { data: { color } });
			}
		},
		onSuccess: () => {
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['tags'] });
			setCheckedIds?.([]);
			setModalVisible(false);
		},
		onError: (err) => {
			logError('useChangeTagColor', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
		},
	});

	const openModal = useCallback(() => {
		setSelectedColor(PALETTE_COLORS[0].bg);
		setModalVisible(true);
	}, []);

	const closeModal = useCallback(() => {
		if (mutation.isPending) return;
		mutation.mutate(selectedColor);
		setModalVisible(false);
	}, [mutation, selectedColor]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	const modalNode = useMemo(
		() => (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={closeModal}
				header={t('lines.tagsChangeColor')}
				innerStyle={tableStyles.modalInner}
			>
				<Text>{t('lines.tagsChangeColor')}</Text>
				<ColorPaletteInline
					selectedColor={selectedColor}
					onSelect={setSelectedColor}
				/>
			</ModalWrapper>
		),
		[
			modalVisible,
			closeModal,
			selectedColor,
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
