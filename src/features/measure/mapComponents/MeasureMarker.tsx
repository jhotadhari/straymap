/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { PixelRatio } from 'react-native';
import { LayerMarker, Marker, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMeasurePosition } from '../selectors';
import { RECORDED_LINE_COLOR } from '../../../constants';

/** Marker diameter in dp. */
const MARKER_SIZE_DP = 12;

/**
 * Measure-distance marker: a native marker (small red circle with a black
 * border, matching the GNSS direction-marker family) at the measured
 * position. Drawn by the map itself every frame — no lag on pan.
 */
const MeasureMarker: FC = () => {
	const position = useAppSelector(selectMeasurePosition);

	// The native marker canvas is raw pixels — scale dp by density.
	const sizePx = useMemo(() => Math.round(MARKER_SIZE_DP * PixelRatio.get()), []);

	const paint = useMemo(
		() => ({
			width: sizePx,
			height: sizePx,
			fillColor: RECORDED_LINE_COLOR as `#${string}`,
			strokeColor: '#000000' as `#${string}`,
			strokeWidth: 2,
			hotspotPlace: 'CENTER' as const,
		}),
		[sizePx]
	);

	if (!position) {
		return null;
	}

	return (
		<ReindexScope order={500}>
			<LayerMarker>
				<Marker
					position={[position.lng, position.lat]}
					paint={paint}
				/>
			</LayerMarker>
		</ReindexScope>
	);
};

export default MeasureMarker;
