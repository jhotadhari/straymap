/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { get } from 'lodash-es';
import Sortable from 'react-native-sortables';
import { GestureResponderEvent } from 'react-native';

import * as elements from '../elements';
import { DashboardItem } from '../types';

const Item: FC<{
	isHandle: boolean;
	item: DashboardItem;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
}> = ({ isHandle, item, onPress }) => {
	const isFixed = 'Portugal' === item.key;

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
					style={{
						paddingHorizontal: 10,
						paddingVertical: 2,
					}}
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

export default Item;
