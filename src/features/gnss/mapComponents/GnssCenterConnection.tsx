/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { LayerLabel, LayerScreenLine, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition, selectIsCenterActive, selectShowMeasurementLabel } from '../selectors';
import { selectMeasureActive } from '../../measure/selectors';
import { selectMovedPointId } from '../../routing/selectors';
import { useGnssCenterMode } from '../hooks/useGnssCenterMode';

/**
 * GNSS center-mode connection: while the map is panned away from the
 * GNSS position (the position itself is a native marker in
 * GnssCenterMarker), a native line connects the viewport center to the
 * fix and a native label shows the distance/bearing.
 *
 * The line's center end and the label are screen-anchored and
 * re-resolved per frame on the Java side — the line's geometry is
 * rebuilt on the GL thread from the frame's own viewport, so both stay
 * glued to the map with zero latency and zero bridge crossings.
 *
 * Only one center-connection line is shown at a time — while a
 * measure-distance measurement or a waypoint move is active, the GNSS
 * line stays hidden. The label can also be hidden persistently via its
 * short-press menu.
 */
const GnssCenterConnection: FC = () => {
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const measureActive = useAppSelector(selectMeasureActive);
	const movedPointId = useAppSelector(selectMovedPointId);
	const showMeasurementLabel = useAppSelector(selectShowMeasurementLabel);
	const theme = useTheme();
	const { mode, labelText } = useGnssCenterMode();

	const linePaint = useMemo(
		() => ({
			strokeColor: '#000000' as `#${string}`,
			// Screen-fixed width in dp.
			strokeWidth: 2,
			cap: 'ROUND' as const,
		}),
		[]
	);

	const labelPaint = useMemo(
		() => ({
			fontSize: 12,
			textColor: theme.colors.onSurface as `#${string}`,
			backgroundColor: theme.colors.surface as `#${string}`,
			borderRadius: 6,
			paddingHorizontal: 8,
			paddingVertical: 3,
			fontStyle: 'BOLD' as const,
		}),
		[theme.colors.onSurface, theme.colors.surface]
	);

	if (!isCenterActive || !gnssPosition) {
		return null;
	}

	const showConnection =
		(mode === 'pannedAway' || mode === 'returning') &&
		!measureActive &&
		movedPointId === null;

	if (!showConnection) {
		return null;
	}

	return (
		<>
			<ReindexScope order={450}>
				<LayerScreenLine
					coordinates={[
						[gnssPosition.lng, gnssPosition.lat],
						['50%', '50%'],
					]}
					paint={linePaint}
				/>
			</ReindexScope>

			{showMeasurementLabel && labelText && (
				<ReindexScope order={550}>
					<LayerLabel
						text={labelText}
						position={['50%', '50%']}
						followPosition={[gnssPosition.lng, gnssPosition.lat]}
						paint={labelPaint}
					/>
				</ReindexScope>
			)}
		</>
	);
};

export default GnssCenterConnection;
