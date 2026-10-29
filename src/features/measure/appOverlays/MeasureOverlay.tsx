/**
 * External dependencies
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { get } from 'lodash-es';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMeasurePosition } from '../selectors';
import { selectUnitPrefs } from '../../general/selectors';
import { useMapEventInterval } from '../../dashboard/hooks/useMapEventInterval';
import { emitMapContextMenu } from '../../mapContextMenu/controller';
import {
	bearingBetween,
	formatBearing,
	formatDistance,
	haversineDistance,
} from '../../../lib/formatting';
import CenterConnectionOverlay from '../../../components/mapOverlays/CenterConnectionOverlay';

/**
 * Measure-distance overlay: while a measurement is active, renders the
 * shared center-connection line + label between the map center and the
 * measured position. The label shows the distance (unitPref) and the
 * bearing from the measured position to the map center (degrees only,
 * same convention as the GNSS center-mode label).
 */
const MeasureOverlay = () => {
	const position = useAppSelector(selectMeasurePosition);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const targetSv = useSharedValue<{ lat: number; lng: number } | null>(null);
	const showSv = useSharedValue(false);

	useEffect(() => {
		if (position) {
			targetSv.value = { lat: position.lat, lng: position.lng };
			showSv.value = true;
		} else {
			targetSv.value = null;
			showSv.value = false;
		}
	}, [
		position,
		targetSv,
		showSv,
	]);

	const positionRef = useRef(position);
	positionRef.current = position;

	const [labelText, setLabelText] = useState<string | null>(null);

	// Recompute the label while the map center moves (string-deduped).
	useMapEventInterval((event) => {
		const pos = positionRef.current;
		const center = event?.center;
		if (!pos || !center || center.length < 2) {
			setLabelText((prev) => (prev === null ? prev : null));
			return;
		}
		const dist = haversineDistance([center[0], center[1]], [pos.lng, pos.lat]);
		const text = `${formatDistance(dist, get(unitPrefs, ['distance']))}\n${formatBearing(bearingBetween([pos.lng, pos.lat], [center[0], center[1]]))}`;
		setLabelText((prev) => (prev === text ? prev : text));
	});

	// Label press opens the short context menu (stop measurement), anchored
	// at the pressed label (map-local physical px — same space as map taps).
	const handleLabelPress = useCallback(({ x, y }: { x: number; y: number }) => {
		if (!positionRef.current) {
			return;
		}
		emitMapContextMenu({
			press: 'short',
			pressOrigin: 'label',
			lng: positionRef.current.lng,
			lat: positionRef.current.lat,
			x,
			y,
			windowX: 0,
			windowY: 0,
			hits: [],
		});
	}, []);

	if (!position) {
		return null;
	}

	return (
		<CenterConnectionOverlay
			targetSv={targetSv}
			showSv={showSv}
			labelText={labelText}
			onLabelPress={handleLabelPress}
		/>
	);
};

export default memo(MeasureOverlay);
