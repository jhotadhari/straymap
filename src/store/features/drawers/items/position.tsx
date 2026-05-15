/**
 * External dependencies
 */
import React from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DrawerItem } from '../types';

const DisplayComponent = () => {
	const { t } = useTranslation();

	return (
		<View
			style={
				{
					// minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
					// ...style,
				}
			}
		>
			<Text>bla position</Text>
		</View>
	);
};

export default {
	key: 'position',
	label: 'position',
	DisplayComponent,
	// IconComponent,
	iconSource: 'crosshairs-gps',
} as DrawerItem;
