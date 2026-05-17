/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import IconIcomoon from '../../../../components/generic/IconIcomoon';
import { DrawerItem } from '../types';
import { handleSize, iconSize, itemStyles } from '../constants';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	return (
		<View style={itemStyles.item}>
			<View style={itemStyles.buttonRow}>
				<Text>
					bla searchPlace
				</Text>
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
	DisplayComponent,
	IconComponent,
	// iconSource: 'search',
} as DrawerItem;
