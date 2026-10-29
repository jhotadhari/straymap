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
import { selectSideForKey, selectSortable } from '../selectors';
import { moveItemKey, setSortable } from '../slice';
import { SETTINGS_HANDLE_KEY } from '../constants';
import { DrawerSide } from '../types';
import DrawerControlModal from '../components/controls/DrawerControlModal';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import OptionMenuRowControl from '../../../components/generic/controls/OptionMenuRowControl';
import { useButtonProps } from '../../../compose/useButtonProps';
import ListItem from '../../../components/generic/wrapper/ListItem';
import { OptionBase } from '../../../types';

const settingsHandleSideOptions: OptionBase[] = [
	{
		key: 'none',
		label: 'drawers.settingsHandleSide.none',
	},
	{
		key: 'left',
		label: 'drawers.settingsHandleSide.left',
	},
	{
		key: 'right',
		label: 'drawers.settingsHandleSide.right',
	},
];

const SettingsDrawers: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const buttonProps = useButtonProps({ mode: 'outlined' });

	const sortable = useAppSelector(selectSortable);

	const settingsHandleSide = useAppSelector((state) =>
		selectSideForKey(state, SETTINGS_HANDLE_KEY)
	);

	const settingsHandleSideValue = useMemo(
		() => settingsHandleSide ?? 'none',
		[settingsHandleSide]
	);

	const [modalVisible, setModalVisible] = useState(false);

	const handleUpdateSettingsHandleSide = useCallback(
		(newValue: string) => {
			if (newValue === settingsHandleSideValue) {
				return;
			}
			dispatch(
				moveItemKey({
					itemKey: SETTINGS_HANDLE_KEY,
					side: 'none' === newValue ? 'available' : (newValue as DrawerSide),
					index: Infinity,
				})
			);
		},
		[dispatch, settingsHandleSideValue]
	);

	const handleToggleSortable = useCallback(() => {
		dispatch(setSortable(!sortable));
	}, [dispatch, sortable]);

	const handleOpenModal = useCallback(() => {
		setModalVisible(true);
	}, []);

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
					<OptionMenuRowControl
						label={t('drawers.settingsHandle')}
						Info={t('drawers.hintSettingsHandleSide')}
						options={settingsHandleSideOptions}
						value={settingsHandleSideValue}
						onUpdate={handleUpdateSettingsHandleSide}
						compact={true}
					/>
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
