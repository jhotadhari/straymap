/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectShowSettingsHandle } from '../selectors';
import { setShowSettingsHandle } from '../slice';
import DrawerControlModal from '../components/controls/DrawerControlModal';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';

const SettingsDrawers: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const showSettingsHandle = useAppSelector(selectShowSettingsHandle);

	const [modalVisible, setModalVisible] = useState(false);

	const handleToggleShowSettingsHandle = useCallback(() => {
		dispatch(setShowSettingsHandle(!showSettingsHandle));
	}, [dispatch, showSettingsHandle]);

	const handleOpenModal = useCallback(() => {
		setModalVisible(true);
	}, []);

	const toggleIcon = useMemo(
		() => (showSettingsHandle ? 'toggle-switch-off-outline' : 'toggle-switch-outline'),
		[showSettingsHandle]
	);

	const toggleLabel = useMemo(
		() =>
			showSettingsHandle ? t('drawers.showSettingsHandle') : t('drawers.hideSettingsHandle'),
		[showSettingsHandle, t]
	);

	return (
		<ScrollView style={style}>
			<InfoRowControl
				label={toggleLabel}
				Info={t('drawers.hintShowSettingsHandle')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handleToggleShowSettingsHandle}
					icon={toggleIcon}
					textColor={theme.colors.onBackground}
				>
					{toggleLabel}
				</ButtonHighlight>
			</InfoRowControl>

			<InfoRowControl
				label={t('drawers.configureDrawers')}
				Info={t('drawers.hintConfigureDrawers')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handleOpenModal}
					icon="cog"
					textColor={theme.colors.onBackground}
				>
					{t('drawers.configureDrawers')}
				</ButtonHighlight>
			</InfoRowControl>

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
