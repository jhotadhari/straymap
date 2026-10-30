/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { LayerPath, ReindexScope } from 'react-native-mapsforge-vtm';
import { useQuery } from '@tanstack/react-query';
import { lineString, simplify as turfSimplify } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectTrackLineId } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';
import useSimplificationTolerance from '../../lines/hooks/useSimplificationTolerance';

const paintRecordingLine = {
	// The library doubles the strokeWidth for patterned styles (the
	// engine's textured-line bucket renders at width/4 vs the solid
	// bucket's width/2), so this lands at 3.5 effective units vs the
	// routing ramp's 3 units (strokeWidth 6 / 2) — a slight overshoot
	// to make the chevron line read as thick as the solid routing line.
	strokeWidth: 7,
	// Repeating chevron texture (android/app/src/main/assets/textures/):
	// white chevrons tinted red, transparent gaps let the map show
	// through. The visual period is exactly `stipple` px (the texture
	// uploads with GL_REPEAT, so the tile fills the full period).
	textureFilePath: 'textures/recording-chevron.png',
	stipple: 20,
	stippleColor: '#FF4444' as `#${string}`,
	transparent: true,
	fixed: true,
};

const TrackRecordingMapView: FC = () => {
	const lineId = useAppSelector(selectTrackLineId);
	const simplify = useSimplificationTolerance();

	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId ?? -1,
		],
		queryFn: queryLineGeom,
		enabled: lineId != null,
		gcTime: 1000 * 10,
	});

	// Zoom-adaptive simplification: the raw 5m-interval recording
	// geometry produces segments shorter than one texture-length unit at
	// low zoom, and the engine's pattern accumulator truncates those to
	// zero — the chevron phase freezes and crumbles. Simplifying with a
	// zoom-scaled tolerance (same ladder as the lines feature) keeps
	// segments long enough for the pattern at every zoom level.
	const coordinates = useMemo(() => {
		const coords = line?.geometry?.coordinates;
		if (!coords || coords.length < 2) {
			return undefined;
		}
		if (simplify == null) {
			return coords;
		}
		const result = turfSimplify(lineString(coords), {
			tolerance: simplify,
			highQuality: false,
		});
		return result.geometry.coordinates;
	}, [line?.geometry?.coordinates, simplify]);

	return (
		<ReindexScope order={310}>
			{coordinates && coordinates.length >= 2 && (
				<LayerPath
					coordinates={coordinates}
					paint={paintRecordingLine}
				/>
			)}
		</ReindexScope>
	);
};

export default TrackRecordingMapView;
