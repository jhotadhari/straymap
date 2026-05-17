/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useContext, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../../baseMap/components/controls/layers/LayersControl';
import ProfilesControl from '../../baseMap/components/controls/profiles/ProfilesControl';
import { useAppDispatch } from '../../../hooks';
import { setUiItemKeys } from '../../ui/uiSlice';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import DrawerContext from '../DrawerContext';
import { DrawerItem } from '../types';
import { handleSize, iconSize, itemStyles } from '../constants';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	const { width, height, side } = useContext(DrawerContext);

	const theme = useTheme();

	const dispatch = useAppDispatch();

	return (
		<View style={itemStyles.item}>
			<ButtonHighlight
				style={itemStyles.buttonRow}
				mode="outlined"
				onPress={() => dispatch(setUiItemKeys(['settings', 'maps']))}
			>
				<Text>{t('drawers.openMapsSettings')}</Text>
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
	DisplayComponent,
	iconSource: 'map',
} as DrawerItem;
