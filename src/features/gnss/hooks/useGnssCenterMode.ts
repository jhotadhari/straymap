/**
 * External dependencies
 */
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { get } from 'lodash-es';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition, selectIsCenterActive, selectRecenterDelaySec } from '../selectors';
import { selectMeasureActive } from '../../measure/selectors';
import { selectUnitPrefs } from '../../general/selectors';
import { AppContext, MapContext } from '../../../Context';
import { useMapEventInterval } from '../../dashboard/hooks/useMapEventInterval';
import {
	bearingBetween,
	formatBearing,
	formatDistance,
	haversineDistance,
} from '../../../lib/formatting';

export type GnssCenterMode = 'off' | 'centered' | 'pannedAway' | 'returning';

/** Max distance (m) between map center and GNSS position to count as centered. */
const CENTER_EPS_M = 2;
/** Chase-cam animation duration while following the moving GNSS position. */
const CHASE_DURATION_MS = 400;
/** Re-centering flight duration after the panned-away timer fires. */
const RETURN_DURATION_MS = 600;

/**
 * Center-mode state machine:
 *
 * - centered:   map center sits on the GNSS position; each new fix flies
 *               the map to the new position (chase-cam).
 * - pannedAway: the user panned away; a stillness timer
 *               (recenterDelaySec) counts down, reset by further movement.
 * - returning:  the timer fired and the map is flying back.
 *
 * Only movement not caused by the hook's own flyTo calls counts as a user
 * pan (flightSeqRef suppresses detection while an animation runs).
 */
export function useGnssCenterMode(): {
	mode: GnssCenterMode;
	labelText: string | null;
} {
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const recenterDelaySec = useAppSelector(selectRecenterDelaySec);
	const measureActive = useAppSelector(selectMeasureActive);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { currentMapEventRef } = useContext(MapContext);

	const { flyTo } = useMap(mapViewNativeNodeHandle);

	const [mode, setMode] = useState<GnssCenterMode>('off');
	const [labelText, setLabelText] = useState<string | null>(null);

	// Refs keep the interval callback and timeouts fresh without
	// re-registering them on every state change.
	const isCenterActiveRef = useRef(isCenterActive);
	isCenterActiveRef.current = isCenterActive;
	const gnssPositionRef = useRef(gnssPosition);
	gnssPositionRef.current = gnssPosition;
	const recenterDelaySecRef = useRef(recenterDelaySec);
	recenterDelaySecRef.current = recenterDelaySec;
	const measureActiveRef = useRef(measureActive);
	measureActiveRef.current = measureActive;
	const unitPrefsRef = useRef(unitPrefs);
	unitPrefsRef.current = unitPrefs;
	const modeRef = useRef(mode);
	modeRef.current = mode;

	// In-flight sequence counter: > 0 while any own flyTo animation runs.
	// A counter (not a boolean) survives overlapping flights — only the
	// awaiter of the newest flight clears it.
	const flightSeqRef = useRef(0);
	const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCenterRef = useRef<[number, number] | null>(null);
	const pendingReturnRef = useRef(false);

	const clearReturnTimer = useCallback(() => {
		if (returnTimerRef.current !== null) {
			clearTimeout(returnTimerRef.current);
			returnTimerRef.current = null;
		}
	}, []);

	const flyToGnss = useCallback(
		async (duration: number): Promise<void> => {
			if (!mapViewNativeNodeHandle) {
				return;
			}
			const gnss = gnssPositionRef.current;
			if (!gnss) {
				return;
			}
			flightSeqRef.current += 1;
			const seq = flightSeqRef.current;
			try {
				await flyTo({ center: [gnss.lng, gnss.lat] }, { duration });
			} catch {
				// A user gesture cancels the animation — the poll below
				// then treats the resulting offset as a pan.
			}
			if (flightSeqRef.current === seq) {
				flightSeqRef.current = 0;
			}
		},
		[flyTo, mapViewNativeNodeHandle]
	);

	const armReturnTimer = useCallback(() => {
		clearReturnTimer();
		returnTimerRef.current = setTimeout(() => {
			returnTimerRef.current = null;
			// While a measure-distance measurement is active the map must
			// not jump back to the GNSS position — stay panned away; the
			// measurement-end effect re-arms the countdown.
			if (measureActiveRef.current) {
				return;
			}
			const gnss = gnssPositionRef.current;
			if (!gnss) {
				// No fix right now — fly back as soon as the next fix arrives.
				pendingReturnRef.current = true;
				return;
			}
			setMode('returning');
			flyToGnss(RETURN_DURATION_MS);
		}, recenterDelaySecRef.current * 1000);
	}, [clearReturnTimer, flyToGnss]);

	// Toggle changes: off → cleanup, on → assume centered and fly to the
	// current fix (or wait for the first fix to arrive).
	useEffect(() => {
		if (!isCenterActive) {
			clearReturnTimer();
			pendingReturnRef.current = false;
			flightSeqRef.current = 0;
			lastCenterRef.current = null;
			setMode('off');
			setLabelText(null);
			return;
		}
		setMode('centered');
		flyToGnss(CHASE_DURATION_MS);
	}, [
		isCenterActive,
		clearReturnTimer,
		flyToGnss,
	]);

	// Chase-cam: follow each new fix while centered. Also covers the
	// initial flight when enabling without a fix, and the pending return
	// when the timer fired while no fix was available.
	useEffect(() => {
		if (!isCenterActive || !gnssPosition) {
			return;
		}
		const currentMode = modeRef.current;
		if (currentMode === 'off') {
			setMode('centered');
			flyToGnss(CHASE_DURATION_MS);
			return;
		}
		if (currentMode === 'centered') {
			const center = currentMapEventRef.current?.center;
			const alreadyThere =
				center &&
				haversineDistance([center[0], center[1]], [gnssPosition.lng, gnssPosition.lat]) <
					CENTER_EPS_M;
			if (!alreadyThere) {
				flyToGnss(CHASE_DURATION_MS);
			}
			return;
		}
		if (currentMode === 'pannedAway' && pendingReturnRef.current) {
			pendingReturnRef.current = false;
			clearReturnTimer();
			setMode('returning');
			flyToGnss(RETURN_DURATION_MS);
		}
	}, [
		isCenterActive,
		gnssPosition,
		currentMapEventRef,
		clearReturnTimer,
		flyToGnss,
	]);

	// While a measure-distance measurement is active the map stays where
	// the user panned it; when the measurement ends, resume the normal
	// re-center countdown if the map is still panned away.
	const wasMeasureActiveRef = useRef(measureActive);
	useEffect(() => {
		const was = wasMeasureActiveRef.current;
		wasMeasureActiveRef.current = measureActive;
		if (
			was &&
			!measureActive &&
			isCenterActiveRef.current &&
			modeRef.current === 'pannedAway'
		) {
			armReturnTimer();
		}
	}, [measureActive, armReturnTimer]);

	// Pan/return detection at the configured map-update interval.
	useMapEventInterval((event) => {
		if (!isCenterActiveRef.current || flightSeqRef.current > 0) {
			return;
		}
		const gnss = gnssPositionRef.current;
		const center = event?.center;
		if (!gnss || !center || center.length < 2) {
			return;
		}

		const dist = haversineDistance([center[0], center[1]], [gnss.lng, gnss.lat]);
		const centered = dist < CENTER_EPS_M;
		const currentMode = modeRef.current;

		const last = lastCenterRef.current;
		const centerMoved =
			!last || Math.abs(last[0] - center[0]) > 1e-7 || Math.abs(last[1] - center[1]) > 1e-7;
		lastCenterRef.current = [center[0], center[1]];

		if (currentMode === 'centered') {
			if (!centered) {
				setMode('pannedAway');
				armReturnTimer();
			}
			return;
		}
		if (currentMode === 'pannedAway') {
			if (centered) {
				clearReturnTimer();
				setMode('centered');
			} else if (centerMoved) {
				// Keep browsing — reset the countdown.
				armReturnTimer();
			}
		} else if (currentMode === 'returning') {
			if (centered) {
				setMode('centered');
			} else {
				// The return flight was interrupted (or landed off target).
				setMode('pannedAway');
				armReturnTimer();
			}
		}

		if (!centered && (modeRef.current === 'pannedAway' || modeRef.current === 'returning')) {
			const text = `${formatDistance(dist, get(unitPrefsRef.current, ['distance']))}\n${formatBearing(bearingBetween(gnss, [center[0], center[1]]))}`;
			setLabelText((prev) => (prev === text ? prev : text));
		}
	});

	// Clear the label outside panned-away/returning.
	useEffect(() => {
		if (mode === 'off' || mode === 'centered') {
			setLabelText((prev) => (prev === null ? prev : null));
		}
	}, [mode]);

	return { mode, labelText };
}

export default useGnssCenterMode;
