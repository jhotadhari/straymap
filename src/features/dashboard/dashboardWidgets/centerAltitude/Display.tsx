/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { clamp, get } from 'lodash-es';
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

const getDelay = (attempt: number) => clamp(10 * Math.pow(2, attempt), 100, 500);

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

	const { getAltitudeAtPosition, hasDataAtPosition } = useMap(mapViewNativeNodeHandle);

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
	// Retries on cache-miss / transient errors with exponential backoff
	// (capped at 2 s).  The cleanup function cancels the retry chain
	// automatically when movement resumes (settledCenter → null) or the
	// component unmounts.
	useEffect(() => {
		if (!settledCenter || !hgtDirPathStore) return;

		const [lng, lat] = settledCenter;
		let cancelled = false;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;

		// Check whether an HGT file exists at all before entering the
		// retry loop — no point waiting for a tile that isn't there.
		hasDataAtPosition(lng, lat).then((hasData) => {
			if (cancelled || !hasData) {
				return;
			}

			const tryQuery = (attempt: number) => {
				if (cancelled) return;

				getAltitudeAtPosition(lng, lat)
					.then((result) => {
						if (cancelled) return;
						if (null !== result) {
							setAltitudeP(result);
						} else {
							// Cache miss (ElevationReader started a
							// background tile load) or genuine void area.
							// Retry with backoff — most tiles load within
							// a few hundred ms.
							retryTimer = setTimeout(() => tryQuery(attempt + 1), getDelay(attempt));
						}
					})
					.catch((err) => {
						if (cancelled) return;
						logError('centerAltitude.getAltitudeAtPosition', err);
						// Transient error (e.g. ElevationReader not yet
						// configured on the native side) — retry.
						retryTimer = setTimeout(() => tryQuery(attempt + 1), getDelay(attempt));
					});
			};

			tryQuery(0);
		});

		return () => {
			cancelled = true;
			if (retryTimer !== null) clearTimeout(retryTimer);
		};
	}, [
		settledCenter,
		hgtDirPathStore,
		getAltitudeAtPosition,
		hasDataAtPosition,
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
