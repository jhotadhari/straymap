/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../../types';
import useItemStyle from '../../hooks/useItemStyle';
import ElementFrame from '../../components/ElementFrame';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth } = useItemStyle(item);

	const textStyle = useMemo(() => ({ fontSize }), [fontSize]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			onPress={onPress}
		>
			<Text style={textStyle}>{''}</Text>
		</ElementFrame>
	);
};

export default Display;
