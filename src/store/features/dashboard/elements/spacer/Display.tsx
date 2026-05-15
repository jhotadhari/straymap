/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../hooks';
import { DashboardElementProps } from '../../types';
import { selectDashboardStyle } from '../../selectors';
import * as elements from '../../elements';

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

	const dashboardStyle = useAppSelector(selectDashboardStyle);

	const fontSize = dashboardStyle.fontSize;

	const minWidth = useMemo(
		() => item?.minWidth ?? get(elements, [item?.elementType || '', 'defaultMinWidth'], 75),
		[item?.minWidth, item?.elementType]
	);

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
