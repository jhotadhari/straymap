/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useContext } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../components/controls/layers/LayersControl';
import ProfilesControl from '../components/controls/profiles/ProfilesControl';
import { useAppDispatch } from '../../../store/hooks';
import { setUiItemKeys } from '../../ui/slice';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import DrawerContext from '../../drawers/DrawerContext';
import { DrawerPanel } from '../../drawers/types';
import { itemStyles } from '../../drawers/constants';
import BaseMapIcon from '../components/BaseMapIcon';
import { useButtonProps } from '../../../compose/useButtonProps';

const DisplayComponentScroll: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled: _scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	const { width, side } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const openMapsSettings = useCallback(
		() => dispatch(setUiItemKeys(['settings', 'maps'])),
		[dispatch]
	);

	const buttonProps = useButtonProps({
		style: itemStyles.buttonRow,
	});

	return (
		<View style={itemStyles.item}>
			<ButtonHighlight
				{...buttonProps}
				onPress={openMapsSettings}
			>
				{t('drawers.openMapsSettings')}
			</ButtonHighlight>

			<View style={itemStyles.itemRow}>
				<LayersControl
					setScrollEnabled={setScrollEnabled}
					width={width}
					reverseDraggableItem={'left' === side}
					uiStateKey={'DrawerMapLayersExpanded' + side}
					newLabel={t('addNew')}
					saveOnChange={true}
					saveOnUnmount={false}
				/>
			</View>
			<View style={itemStyles.itemRow}>
				<ProfilesControl
					setScrollEnabled={setScrollEnabled}
					width={width}
					reverseDraggableItem={'left' === side}
					uiStateKey={'DrawerMapsforgeProfilesExpanded' + side}
					newLabel={t('addNew')}
					saveOnChange={true}
					saveOnUnmount={false}
				/>
			</View>
		</View>
	);
};

export default {
	key: 'maps',
	label: 'maps',
	DisplayComponentScroll,
	IconComponent: BaseMapIcon,
} as DrawerPanel;
