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
import useMapZoomLevel from '../../../../../compose/useMapZoomLevel';
import ElementFrame from '../../components/ElementFrame';

export interface Options {}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const zoomLevel = useMapZoomLevel();

	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			textAlign={textAlign}
			onPress={onPress}
		>
			{zoomLevel && <Text style={textStyle}>{zoomLevel}</Text>}
		</ElementFrame>
	);
};

export default Display;
