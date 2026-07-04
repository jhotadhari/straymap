/**
 * External dependencies
 */
import React, { FC, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { DashboardElementProps } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import { useMapEventInterval } from '../../../dashboard/hooks/useMapEventInterval';
import ElementFrame from '../../../dashboard/components/ElementFrame';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
	useMapEventInterval((event) => {
		setAccuracy((event as any)?.accuracy);
	});

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
			<Text style={textStyle}>
				{accuracy !== undefined ? `${accuracy.toFixed(1)} m` : '-'}
			</Text>
		</ElementFrame>
	);
};

export default Display;
