/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { get } from 'lodash-es';
import Sortable from 'react-native-sortables';
import { GestureResponderEvent, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import * as elements from '../elements';
import { DashboardItem } from '../types';
import { useAppSelector } from '../../../hooks';
import { selectEditItemKey } from '../selectors';

const Item: FC<{
	isHandle: boolean;
	item: DashboardItem;
	style?: ViewStyle;
	highlightEditItem?: boolean;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
}> = ({ isHandle, item, style, onPress, highlightEditItem }) => {
	const isFixed = false; // 'Portugal' === item.key;

	const theme = useTheme();

	const editItemKey = useAppSelector(selectEditItemKey);

	console.log('debug editItemKey', editItemKey); // debug

	const Display = useMemo(
		() =>
			get(elements, [
				item.elementType,
				'Display',
			]),
		[item.elementType]
	);

	const node = useMemo(
		() =>
			Display && (
				<Display
					style={[
						styles.display,
						style,
						highlightEditItem && editItemKey === item?.key
							? {
									borderColor: theme.colors.primary,
								}
							: undefined,
					]}
					key={item.key}
					dashboardElement={item}
					onPress={onPress}
					item={item}
				/>
			),
		[
			onPress,
			Display,
			item,
			editItemKey,
		]
	);

	if (isHandle) {
		return (
			<Sortable.Handle mode={isFixed ? 'fixed-order' : 'draggable'}>{node}</Sortable.Handle>
		);
	} else {
		return node;
	}
};

const styles = StyleSheet.create({
	display: {
		paddingHorizontal: 10,
		paddingVertical: 2,
		borderWidth: 1,
		borderStyle: 'solid',
	},
});

export default Item;
