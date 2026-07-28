/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectShowSettingsHandle, selectSortable } from '../selectors';
import { setShowSettingsHandle, setSortable } from '../slice';
import DrawerControlModal from '../components/controls/DrawerControlModal';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import ListItem from '../../../components/generic/wrapper/ListItem';

const SettingsDrawers: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const buttonProps = useButtonProps({ mode: 'outlined' });

	const showSettingsHandle = useAppSelector(selectShowSettingsHandle);
	const sortable = useAppSelector(selectSortable);

	const [modalVisible, setModalVisible] = useState(false);

	const handleToggleShowSettingsHandle = useCallback(() => {
		dispatch(setShowSettingsHandle(!showSettingsHandle));
	}, [dispatch, showSettingsHandle]);

	const handleToggleSortable = useCallback(() => {
		dispatch(setSortable(!sortable));
	}, [dispatch, sortable]);

	const handleOpenModal = useCallback(() => {
		setModalVisible(true);
	}, []);

	const toggleLabel = useMemo(
		() =>
			showSettingsHandle ? t('drawers.showSettingsHandle') : t('drawers.hideSettingsHandle'),
		[showSettingsHandle, t]
	);

	const sortableLabel = useMemo(
		() => (sortable ? t('drawers.sortableEnabled') : t('drawers.sortableDisabled')),
		[sortable, t]
	);

	return (
		<ScrollView style={style}>
			<ListItem
				title={
					<InfoLabelRow
						label={t('drawers.selectDrawers')}
						Info={t('drawers.hintSelectDrawers')}
					>
						<ButtonHighlight
							{...buttonProps}
							compact={true}
							onPress={handleOpenModal}
						>
							{t('drawers.selectDrawers')}
						</ButtonHighlight>
					</InfoLabelRow>
				}
			/>

			<ListItem
				title={
					<InfoLabelRow
						label={t('drawers.settingsHandle')}
						Info={t('drawers.hintShowSettingsHandle')}
					>
						<ButtonHighlight
							{...buttonProps}
							compact={true}
							onPress={handleToggleShowSettingsHandle}
						>
							{toggleLabel}
						</ButtonHighlight>
					</InfoLabelRow>
				}
			/>

			<ListItem
				title={
					<InfoLabelRow
						label={t('drawers.sortableHandle')}
						Info={t('drawers.hintSortableHandle')}
					>
						<ButtonHighlight
							{...buttonProps}
							compact={true}
							onPress={handleToggleSortable}
						>
							{sortableLabel}
						</ButtonHighlight>
					</InfoLabelRow>
				}
			/>

			{modalVisible && (
				<DrawerControlModal
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
			)}
		</ScrollView>
	);
};

export default SettingsDrawers;
