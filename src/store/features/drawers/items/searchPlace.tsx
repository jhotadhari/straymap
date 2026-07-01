/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction } from 'react';
import { Text } from 'react-native-paper';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import IconIcomoon from '../../../../components/generic/IconIcomoon';
import { DrawerItem } from '../types';
import { itemStyles } from '../constants';

const DisplayComponentScroll: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled: _scrollEnabled, setScrollEnabled: _setScrollEnabled }) => {
	return (
		<View style={itemStyles.item}>
			<View style={itemStyles.buttonRow}>
				<Text>bla searchPlace</Text>
			</View>
		</View>
	);
};

const IconComponent = ({ color }: { color: string }) => {
	return (
		<IconIcomoon
			style={{ color }}
			name="map-marker-search"
			size={25}
		/>
	);
};

export default {
	key: 'searchPlace',
	label: 'searchPlace',
	DisplayComponentScroll,
	IconComponent,
	// iconSource: 'search',
} as DrawerItem;
