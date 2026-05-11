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
			<Text>bla waypoints</Text>
		</View>
	);
};

export default {
	key: 'waypoints',
	label: 'waypoints',
	DisplayComponent,
	// IconComponent,
	iconSource: 'map-marker',

	// ControlComponent,
	// hasStyleControl: true,
	// shouldSetHgtDirPath: true,
	// defaultMinWidth: 75,
	// responseInclude: { center: 2 },
} as DrawerItem;
