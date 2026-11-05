/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useDeviceAzimuth } from '../../deviceAzimuthStore';
import { DashboardWidgetProps } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import ElementFrame from '../../../dashboard/components/ElementFrame';

export interface Options {
	showNumber?: boolean;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const deviceAzimuth = useDeviceAzimuth();

	// Number shown by default; hidden entirely (no degree sign, no dash)
	// when the item option disables it. The rotating icon is unaffected.
	const showNumber = item?.options?.showNumber !== false;

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
			iconRotation={deviceAzimuth ?? undefined}
		>
			{showNumber && (
				<Text style={textStyle}>{deviceAzimuth == null ? '-' : `${deviceAzimuth}°`}</Text>
			)}
		</ElementFrame>
	);
};

export default Display;
