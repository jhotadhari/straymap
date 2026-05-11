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
import IconIcomoon from '../../../../components/generic/IconIcomoon';
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
			<Text>bla searchPlace</Text>
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

	// ControlComponent,
	// hasStyleControl: true,
	// shouldSetHgtDirPath: true,
	// defaultMinWidth: 75,
	// responseInclude: { center: 2 },
} as DrawerItem;
