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

	const { getAltitudeAtPositionRetry } = useMap(mapViewNativeNodeHandle);

	const [altitudeC, setAltitudeC] = useState<number | undefined>(undefined);
	const [altitudeP, setAltitudeP] = useState<number | undefined>(undefined);
	const [settledCenter, setSettledCenter] = useState<[number, number] | null>(null);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCenterRef = useRef<[number, number] | null>(null);

	// Detect centre-position changes (excluding zoom) and manage a 100 ms
	// "settle" timer.  While the map is moving, altitudeP is cleared so the
	// display immediately shows "–" rather than a stale value.
	useMapEventInterval((event) => {
		if (!hgtDirPathStore) {
			return;
		}
		const newAltC = event?.center?.[2] ?? undefined;
		if (altitudeC !== newAltC) {
			setAltitudeC(newAltC);
		}

		const lng = event?.center?.[0];
		const lat = event?.center?.[1];
		if (lng === undefined || lat === undefined) return;

		// Epsilon so sub-centimetre floating-point jitter doesn't read as
		// movement and perpetually reset the settle timer.
		const EPS = 1e-7;
		const centerChanged =
			!lastCenterRef.current ||
			Math.abs(lastCenterRef.current[0] - lng) > EPS ||
			Math.abs(lastCenterRef.current[1] - lat) > EPS;

		lastCenterRef.current = [lng, lat];

		if (centerChanged) {
			// Clear stale elevation — the new position's elevation
			// is unknown.  altitudeC (from the native hot-path) will
			// repopulate once the HGT tile loads (~200 ms).
			setAltitudeP(undefined);

			// Reset the settle timer.
			if (settleTimerRef.current !== null) {
				clearTimeout(settleTimerRef.current);
			}

			// Clear settled centre — the useEffect below cancels any
			// in-flight query chain when settledCenter goes to null.
			setSettledCenter(null);

			// Arm a new settle timer.  When it fires, the useEffect picks
			// up the new settledCenter and starts querying.
			settleTimerRef.current = setTimeout(() => {
				settleTimerRef.current = null;
				setSettledCenter([lng, lat]);
			}, 100);
		}
	});

	// Query elevation once the map has been stationary for 100 ms.
	// The library's getAltitudeAtPositionRetry handles cache-miss with
	// exponential backoff internally (hasData check + up to 10 retries).
	// Cleanup cancels via the `cancelled` flag when movement resumes.
	useEffect(() => {
		if (!settledCenter || !hgtDirPathStore) return;

		const [lng, lat] = settledCenter;
		let cancelled = false;

		getAltitudeAtPositionRetry(lng, lat).then((result) => {
			if (!cancelled && result !== null) {
				setAltitudeP(result);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [
		settledCenter,
		hgtDirPathStore,
		getAltitudeAtPositionRetry,
	]);

	const altitude = undefined !== altitudeC ? altitudeC : altitudeP;

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
