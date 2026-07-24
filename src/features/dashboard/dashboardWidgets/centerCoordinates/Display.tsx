/**
 * External dependencies
 */
import React, { FC, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { formatCoords } from '../../../../lib/formatting';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { DashboardWidgetProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';
import { useMapEventInterval } from '../../hooks/useMapEventInterval';
import ElementFrame from '../../components/ElementFrame';

export interface Options {
	unitPref?: Partial<UnitPref>;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { t } = useTranslation();

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
	const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
	useMapEventInterval((event) => {
		setCenterLng(event?.center?.[0]);
		setCenterLat(event?.center?.[1]);
	});

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
			{undefined !== centerLng && undefined !== centerLat && (
				<Text style={textStyle}>
					{formatCoords(
						centerLat,
						centerLng,
						{
							unit,
							round,
							coordsPadLng,
							coordsPadLat,
							coordsOrder,
							coordsForceNE,
						},
						t
					)}
				</Text>
			)}
		</ElementFrame>
	);
};

export default Display;
