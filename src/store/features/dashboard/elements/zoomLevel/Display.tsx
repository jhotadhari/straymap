/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';

/**
 * Internal dependencies
*/
import { DashboardElementProps } from '../../types';
import useItemStyle from '../../hooks/useItemStyle';
import useMapZoomLevel from '../../../../../compose/useMapZoomLevel';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const zoomLevel = useMapZoomLevel();

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={[{ minWidth }, style]}>
				{zoomLevel && (
					<Text
						style={{
							fontSize,
							textAlign,
						}}
					>
						{zoomLevel}
					</Text>
				)}
			</View>
		</TouchableHighlight>
	);
};

export default Display;
