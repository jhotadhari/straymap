/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DrawerItem } from '../types';
import { itemStyles, handleSize, iconSize } from '../constants';

const DisplayComponentScroll: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	return (
		<View style={itemStyles.item}>
			<View style={itemStyles.buttonRow}>
				<Text>bla waypoints</Text>
			</View>
		</View>
	);
};

export default {
	key: 'waypoints',
	label: 'waypoints',
	DisplayComponentScroll,
	// IconComponent,
	iconSource: 'map-marker',
} as DrawerItem;
