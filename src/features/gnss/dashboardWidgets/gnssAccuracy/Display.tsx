/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectGnssPosition } from '../../selectors';
import { DashboardWidgetProps } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import ElementFrame from '../../../dashboard/components/ElementFrame';

export interface Options {}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const gnssPosition = useAppSelector(selectGnssPosition);

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
			<Text style={textStyle}>
				{gnssPosition ? `${gnssPosition.accuracy.toFixed(1)} m` : '-'}
			</Text>
		</ElementFrame>
	);
};

export default Display;
