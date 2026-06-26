/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction } from 'react';
import { Text } from 'react-native-paper';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DrawerItem } from '../types';
import { itemStyles } from '../constants';

const DisplayComponentScroll: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled: _scrollEnabled, setScrollEnabled: _setScrollEnabled }) => {
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
