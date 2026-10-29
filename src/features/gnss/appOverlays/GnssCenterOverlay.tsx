/**
 * External dependencies
 */
import React, { memo, useCallback, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition, selectIsCenterActive, selectShowMeasurementLabel } from '../selectors';
import { useGnssCenterMode } from '../hooks/useGnssCenterMode';
import { selectMeasureActive } from '../../measure/selectors';
import { emitMapContextMenu } from '../../mapContextMenu/controller';
import CenterConnectionOverlay from '../../../components/mapOverlays/CenterConnectionOverlay';

/**
 * Center-mode overlay: while the map is panned away from the GNSS
 * position (the position itself is a native marker in GnssCenterMarker),
 * a thin connecting line and a distance/bearing label anchored just
 * beyond the map center are rendered by the shared CenterConnectionOverlay.
 *
 * Only one center-connection line is shown at a time — while a measure-
 * distance measurement is active, the GNSS line stays hidden. The label
 * can also be hidden persistently via the marker control or the label's
 * own short-press context menu.
 */
const GnssCenterOverlay = () => {
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const measureActive = useAppSelector(selectMeasureActive);
	const showMeasurementLabel = useAppSelector(selectShowMeasurementLabel);
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

	// The connecting line always shows while panned away (unless a
	// measure-distance measurement owns the center connection). The
	// showMeasurementLabel setting gates only the label.
	const showConnection = (mode === 'pannedAway' || mode === 'returning') && !measureActive;
	useEffect(() => {
		showConnectionSv.value = showConnection;
	}, [showConnection, showConnectionSv]);

	// Label press opens the short context menu (hide/show label), anchored
	// at the pressed label (map-local physical px — same space as map taps).
	const handleLabelPress = useCallback(
		({ x, y }: { x: number; y: number }) => {
			emitMapContextMenu({
				press: 'short',
				pressOrigin: 'label',
				lng: gnssPosition?.lng ?? 0,
				lat: gnssPosition?.lat ?? 0,
				x,
				y,
				windowX: 0,
				windowY: 0,
				hits: [],
			});
		},
		[gnssPosition]
	);

	if (!isCenterActive) {
		return null;
	}

	return (
		<CenterConnectionOverlay
			targetSv={gnssTargetSv}
			showSv={showConnectionSv}
			labelText={showMeasurementLabel ? labelText : null}
			onLabelPress={handleLabelPress}
		/>
	);
};

export default memo(GnssCenterOverlay);
