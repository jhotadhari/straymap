/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { formatSpeed } from '../../../../lib/formatting';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { selectGnssPosition } from '../../selectors';
import { DashboardWidgetProps } from '../../../dashboard/types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import ElementFrame from '../../../dashboard/components/ElementFrame';

export interface Options {
	unitPref?: Partial<UnitPref>;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const gnssPosition = useAppSelector(selectGnssPosition);

	const unitPref: UnitPref = useMemo(
		() => ({
			...get(unitPrefs, ['speed']),
			...item?.options?.unitPref,
		}),
		[item, unitPrefs]
	);

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
				{gnssPosition ? formatSpeed(gnssPosition.speed, unitPref) : '-'}
			</Text>
		</ElementFrame>
	);
};

export default Display;
