/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { formatHeightDepth } from '../../../../lib/formatting';
import { logError } from '../../../../lib/utils';
import { selectUnitPrefs } from '../../../general/selectors';
import { useAppSelector } from '../../../../store/hooks';
import { DashboardWidgetProps } from '../../types';
import { UnitPref } from '../../../general/types';
import useItemStyle from '../../hooks/useItemStyle';
import { useMapEventInterval } from '../../hooks/useMapEventInterval';
import ElementFrame from '../../components/ElementFrame';
import { AppContext } from '../../../../Context';
import { selectHgtDirPath } from '../../../baseMap/selectors';

export interface Options {
	unitPref?: UnitPref;
}

const Display: FC<DashboardWidgetProps<Options>> = ({ item, style = {}, onPress }) => {
	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);

	const unitPref: UnitPref = useMemo(
		() => ({
			...get(unitPrefs, ['heightDepth']),
			...item?.options?.unitPref,
		}),
		[item, unitPrefs]
	);

	const hgtDirPathStore = useAppSelector(selectHgtDirPath);

	const { getAltitudeAtPosition } = useMap(mapViewNativeNodeHandle);

	const [altitudeC, setAltitudeC] = useState<number | undefined>(undefined);
	const [altitudeP, setAltitudeP] = useState<number | undefined>(undefined);
	const gettingAltitudeRef = useRef(false);

	useMapEventInterval((event) => {
		if (!hgtDirPathStore) {
			return;
		}
		const newAltC = event?.center?.[2] ?? undefined;
		if (altitudeC !== newAltC) {
			setAltitudeC(newAltC);
		}
		if (undefined === newAltC && event?.center && !gettingAltitudeRef.current) {
			gettingAltitudeRef.current = true;
			getAltitudeAtPosition(event?.center[0], event?.center[1])
				.then((result) => {
					setAltitudeP(null !== result ? result : undefined);
					gettingAltitudeRef.current = false;
				})
				.catch((err) => {
					gettingAltitudeRef.current = false;
					logError('centerAltitude.getAltitudeAtPosition', err);
				});
		}
	});

	const altitude =
		undefined !== altitudeC ? altitudeC : gettingAltitudeRef.current ? undefined : altitudeP;

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
				{altitude === undefined ? '-' : formatHeightDepth(altitude, unitPref)}
			</Text>
		</ElementFrame>
	);
};

export default Display;
