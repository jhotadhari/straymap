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
import useMapZoomLevel from '../../../../compose/useMapZoomLevel';
import ElementFrame from '../../components/ElementFrame';
import { roundTo } from '../../../../lib/utilsLight';

export interface Options {}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const zoomLevel = useMapZoomLevel();

	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			showLabel={showLabel}
			showIcon={showIcon}
			textAlign={textAlign}
			onPress={onPress}
		>
			{zoomLevel && <Text style={textStyle}>{roundTo(zoomLevel, 2)}</Text>}
		</ElementFrame>
	);
};

export default Display;
