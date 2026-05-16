/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../../types';
import useItemStyle from '../../hooks/useItemStyle';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const { fontSize, minWidth } = useItemStyle(item);

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={[
					{ minWidth },
					style,
				]}
			>
				<Text
					style={{
						fontSize,
					}}
				>
					{''}
				</Text>
			</View>
		</TouchableHighlight>
	);
};

export default Display;
