/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { LayerScreenLine, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMeasurePosition } from '../selectors';

/**
 * Measure-distance line: a native polyline from the measured position to
 * the viewport center. The center end is a screen-anchored point
 * (['50%', '50%']) — the library rebuilds the line's geometry on the GL
 * thread every frame from the frame's own viewport, so BOTH ends track
 * the map with zero latency (the geo end stays glued to the native
 * marker, the center end to the viewport) and zero bridge crossings.
 */
const MeasureLine: FC = () => {
	const position = useAppSelector(selectMeasurePosition);

	const paint = useMemo(
		() => ({
			strokeColor: '#000000' as `#${string}`,
			// Screen-fixed width in dp.
			strokeWidth: 2,
			cap: 'ROUND' as const,
		}),
		[]
	);

	if (!position) {
		return null;
	}

	return (
		<ReindexScope order={450}>
			<LayerScreenLine
				coordinates={[
					[position.lng, position.lat],
					['50%', '50%'],
				]}
				paint={paint}
			/>
		</ReindexScope>
	);
};

export default MeasureLine;
