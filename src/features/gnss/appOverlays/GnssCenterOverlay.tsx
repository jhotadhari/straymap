/**
 * External dependencies
 */
import React, { memo, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition, selectIsCenterActive } from '../selectors';
import { useGnssCenterMode } from '../hooks/useGnssCenterMode';
import { selectMeasureActive } from '../../measure/selectors';
import CenterConnectionOverlay from '../../../components/mapOverlays/CenterConnectionOverlay';

/**
 * Center-mode overlay: while the map is panned away from the GNSS
 * position (the position itself is a native marker in GnssCenterMarker),
 * a thin connecting line and a distance/bearing label anchored just
 * beyond the map center are rendered by the shared CenterConnectionOverlay.
 *
 * Only one center-connection line is shown at a time — while a measure-
 * distance measurement is active, the GNSS line stays hidden.
 */
const GnssCenterOverlay = () => {
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const measureActive = useAppSelector(selectMeasureActive);
	const { mode, labelText } = useGnssCenterMode();

	const gnssTargetSv = useSharedValue<{ lat: number; lng: number } | null>(null);
	const showConnectionSv = useSharedValue(false);

	useEffect(() => {
		if (gnssPosition) {
			gnssTargetSv.value = { lat: gnssPosition.lat, lng: gnssPosition.lng };
		} else {
			gnssTargetSv.value = null;
		}
	}, [
		gnssPosition,
		gnssTargetSv,
	]);

	const showConnection = (mode === 'pannedAway' || mode === 'returning') && !measureActive;
	useEffect(() => {
		showConnectionSv.value = showConnection;
	}, [showConnection, showConnectionSv]);

	if (!isCenterActive) {
		return null;
	}

	return (
		<CenterConnectionOverlay
			targetSv={gnssTargetSv}
			showSv={showConnectionSv}
			labelText={labelText}
		/>
	);
};

export default memo(GnssCenterOverlay);
