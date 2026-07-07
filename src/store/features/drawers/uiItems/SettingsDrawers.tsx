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
import ListItem from '../../../../components/generic/ListItem';

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

	const toggleLabel = useMemo(
		() =>
			showSettingsHandle ? t('drawers.showSettingsHandle') : t('drawers.hideSettingsHandle'),
		[showSettingsHandle, t]
	);

	return (
		<ScrollView style={style}>
			<ListItem
				title={
					<InfoRowControl
						label={t('drawers.selectDrawers')}
						Info={t('drawers.hintSelectDrawers')}
					>
						<ButtonHighlight
							mode="outlined"
							compact={true}
							onPress={handleOpenModal}
							// icon="cog"
							textColor={theme.colors.onBackground}
							style={{ marginLeft: 8 }}
						>
							{t('drawers.selectDrawers')}
						</ButtonHighlight>
					</InfoRowControl>
				}
			/>

			<ListItem
				title={
					<InfoRowControl
						label={t('drawers.settingsHandle')}
						Info={t('drawers.hintShowSettingsHandle')}
					>
						<ButtonHighlight
							mode="outlined"
							compact={true}
							onPress={handleToggleShowSettingsHandle}
							textColor={theme.colors.onBackground}
							style={{ marginLeft: 8 }}
						>
							{toggleLabel}
						</ButtonHighlight>
					</InfoRowControl>
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
