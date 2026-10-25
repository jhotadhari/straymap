/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { formatCoords } from '../../../../lib/formatting';
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
	const { t } = useTranslation();

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const gnssPosition = useAppSelector(selectGnssPosition);

	const unit = item?.options?.unitPref?.unit ?? get(unitPrefs, ['coordinates', 'unit']);
	const round = item?.options?.unitPref?.round ?? get(unitPrefs, ['coordinates', 'round']);
	const coordsPadLng =
		item?.options?.unitPref?.coordsPadLng ?? get(unitPrefs, ['coordinates', 'coordsPadLng']);
	const coordsPadLat =
		item?.options?.unitPref?.coordsPadLat ?? get(unitPrefs, ['coordinates', 'coordsPadLat']);
	const coordsOrder =
		item?.options?.unitPref?.coordsOrder ?? get(unitPrefs, ['coordinates', 'coordsOrder']);
	const coordsForceNE =
		item?.options?.unitPref?.coordsForceNE ?? get(unitPrefs, ['coordinates', 'coordsForceNE']);

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
				{gnssPosition
					? formatCoords(
							gnssPosition.lat,
							gnssPosition.lng,
							{
								unit,
								round,
								coordsPadLng,
								coordsPadLat,
								coordsOrder,
								coordsForceNE,
							},
							t
						)
					: '-'}
			</Text>
		</ElementFrame>
	);
};

export default Display;
