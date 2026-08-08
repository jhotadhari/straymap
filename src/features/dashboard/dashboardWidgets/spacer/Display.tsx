/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { DashboardWidgetProps } from '../../types';
import useItemStyle from '../../hooks/useItemStyle';
import ElementFrame from '../../components/ElementFrame';

export interface Options {}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, showLabel, showIcon } = useItemStyle(item);

	const textStyle = useMemo(() => ({ fontSize }), [fontSize]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			showLabel={showLabel}
			showIcon={showIcon}
			onPress={onPress}
		>
			<Text style={textStyle}>{''}</Text>
		</ElementFrame>
	);
};

export default Display;
