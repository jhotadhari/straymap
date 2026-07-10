/**
 * External dependencies
 */
import React, { FC, Fragment, useMemo } from 'react';
import {
	GeometryStyle,
	Marker,
	LayerPath,
	ReindexScope,
	SharedLayer,
} from 'react-native-mapsforge-vtm';

import {
	LayerPathColorRamp,
	usePathColorRamp,
	calculateSlope,
	ColorRamp,
} from 'react-native-mapsforge-vtm-ext-path-color-ramp';
import { get } from 'lodash-es';
import { simplify as turfSimplify, lineString } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSegmentByRecordId } from '../selectors';
import { getSegmentRecordId } from '../utils';
import useRoute from '../hooks/useRoute';
// import useSimplificationTolerance from '../../lines/hooks/useSimplificationTolerance';
import { RoutingPoint } from '../types';

const SegmentLineLayer: FC<{
	segmentRecordId: string;
	coordinates: [
		number,
		number,
		number,
  ][];
}> = ({ segmentRecordId, coordinates }) => {

	const prepared = useMemo(
		() => ({
			segmentValues: calculateSlope(coordinates),
			colorRamp: {
				unit: 'percent',
				stops: [
					{ value: -20, color: '#00004d' },
					{ value: -13, color: '#000080' },
					{ value: -7, color: '#0000ff' },
					{ value: -2, color: '#00e8ff' },
					{ value: 0, color: '#00ff00' },
					{ value: 2, color: '#FFDE02' },
					{ value: 7, color: '#ff0000' },
					{ value: 13, color: '#800000' },
					{ value: 20, color: '#4d0000' },
				],
			} as ColorRamp,
		}),
		[coordinates]
	);

	const { colorRampStops, normalizedValues } = usePathColorRamp({
		coordinates,
		segmentValues: prepared.segmentValues,
		colorRamp: prepared.colorRamp,
	});

	return (
		<LayerPathColorRamp
			key={segmentRecordId}
            coordinates={coordinates}
            segmentValues={normalizedValues}
            colorRampStops={colorRampStops}
            style={{ strokeWidth: 6 }}
          />
	);
}

const SegmentLine: FC<{
	simplify?: number;
	segmentRecordId: string;
	placeholderCoordinates: number[][];
}> = ({ simplify, segmentRecordId, placeholderCoordinates }) => {
	const segment = useAppSelector((state) => selectSegmentByRecordId(state, segmentRecordId));

	const simplifiedCoords = useMemo(() => {
		if (!segment?.positions || simplify === undefined) return undefined;
		const line = lineString(segment.positions);
		const result = turfSimplify(line, { tolerance: simplify, highQuality: false });
		return result.geometry.coordinates;
	}, [segment?.positions, simplify]);

	let coords: number[][] | undefined = undefined;
	let style: GeometryStyle | undefined = undefined;

	if (
		!segment ||
		segment?.isFetching ||
		(segment?.positions?.length ?? 0) < 2 ||
		segment?.errorMsg ||
		!simplifiedCoords
	) {
		coords = placeholderCoordinates;
		if (!segment || segment?.isFetching || !simplifiedCoords) {
			style = stylePathFetching;
		} else {
			style = stylePathError;
		}
	} else if (simplifiedCoords) {
		coords = simplifiedCoords;
	}



	if (!coords) {
		return undefined;
	}

	if (!simplifiedCoords) {
		return <LayerPath
			key={segmentRecordId + 'fallback'}
			coordinates={coords}
			style={style}
		/>;
	}

	return (
		<SegmentLineLayer
			key={segmentRecordId}
			segmentRecordId={segmentRecordId}
			coordinates={coords as [number,number,number][]}
		/>
	);

};

const Segments: FC<{
	points?: RoutingPoint[];
}> = ({ points }) => {

	// Lets use a fixed simplification tolerance. Doesn't work fast rerenders with LayerPathColorRamp.
	// const simplify = useSimplificationTolerance();
	const simplify = 0.00004;

	return (
		<ReindexScope order={300}>
			{points &&
				points.length > 0 &&
				points.map((fromPoint, index) => {
					const toPoint = get(points, index + 1);

					if (!toPoint) {
						return undefined;
					}

					const segmentRecordId = getSegmentRecordId({
						fromId: fromPoint.id,
						toId: toPoint.id,
					});

					const placeholderCoordinates = [
						fromPoint?.geometry.coordinates,
						toPoint?.geometry.coordinates,
					];

					return (
						<SegmentLine
							key={segmentRecordId}
							segmentRecordId={segmentRecordId}
							placeholderCoordinates={placeholderCoordinates}
							simplify={simplify}
						/>
					);
				})}
		</ReindexScope>
	);
};

const Markers: FC<{
	points?: RoutingPoint[];
}> = ({ points }) => {
	return (
		<ReindexScope order={400}>
			<SharedLayer>
				{points &&
					points.map((point, index) => (
						<Marker
							key={point.id}
							position={point.geometry.coordinates}
							symbol={{
								text: index + 1 + '',
								textMargin: 15,
							}}
						/>
					))}
			</SharedLayer>
		</ReindexScope>
	);
};

const RoutingMapView = () => {
	const { points } =
		useRoute([
			'points',
		]) || {};

	return (
		<Fragment>
			<Segments points={points} />
			<Markers points={points} />
		</Fragment>
	);
};

// GeometryStyle is a custom map-layer style type, not an RN ViewStyle, so these stay plain objects (not StyleSheet.create).
const stylePathFetching: GeometryStyle = {
	strokeColor: '#0000ff',
	strokeWidth: 3,
};
const stylePathError: GeometryStyle = {
	strokeColor: '#ff0000',
	strokeWidth: 3,
};

export default RoutingMapView;
