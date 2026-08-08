/**
 * External dependencies
 */
import React, { FC, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { formatHeightDepth } from '../../../../lib/formatting';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { DashboardWidgetProps } from '../../../dashboard/types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import { useMapEventInterval } from '../../../dashboard/hooks/useMapEventInterval';
import ElementFrame from '../../../dashboard/components/ElementFrame';

export interface Options {
	unitPref?: Partial<UnitPref>;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const unitPref: UnitPref = useMemo(
		() => ({
			...get(unitPrefs, ['heightDepth']),
			...item?.options?.unitPref,
		}),
		[item, unitPrefs]
	);

	const [altitudeM, setAltitudeM] = useState<number | null>(null);
	useMapEventInterval((event) => {
		setAltitudeM(event?.center?.[2] ?? null);
	});

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
				{altitudeM === null ? '-' : formatHeightDepth(altitudeM, unitPref)}
			</Text>
		</ElementFrame>
	);
};

export default Display;
