/**
 * External dependencies
 */
import React, { ElementType, FC, memo, useMemo } from 'react';
import { get } from 'lodash-es';
import Sortable from 'react-native-sortables';
import { GestureResponderEvent, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { DashboardItem } from '../types';
import { useAppSelector } from '../../../store/hooks';
import { selectEditItemKey } from '../selectors';
import { featureRegistry } from '../../FeatureRegistry';

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

	const Display = useMemo(() => {
		const elementsMap = featureRegistry.getDashboardWidgets();
		return get(elementsMap, [item.elementType, 'Display']) as ElementType<any> | undefined;
	}, [item.elementType]);

	const node = useMemo(
		() =>
			Display && (
				<Display
					style={[
						styles.display,
						style,
						{ borderRadius: theme.roundness },
						highlightEditItem && editItemKey === item?.key
							? {
									borderColor: theme.colors.primary,
								}
							: undefined,
						highlightEditItem && editItemKey !== item?.key
							? {
									borderColor: theme.colors.inverseOnSurface,
								}
							: undefined,
					]}
					key={item.key}
					onPress={onPress}
					item={item}
				/>
			),
		[
			onPress,
			Display,
			item,
			editItemKey,
			style,
			highlightEditItem,
			theme.roundness,
			theme.colors.primary,
			theme.colors.inverseOnSurface,
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
		borderColor: 'transparent',
	},
});

export default memo(Item);
