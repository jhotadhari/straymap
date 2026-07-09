/**
 * External dependencies
 */
import React, { FC, Fragment, useEffect, useMemo, useRef } from 'react';
import {
	GeometryStyle,
	Marker,
	LayerPath,
	ReindexScope,
	SharedLayer,
} from 'react-native-mapsforge-vtm';
import { get } from 'lodash-es';
import { simplify as turfSimplify, lineString } from '@turf/turf';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSegmentByRecordId } from '../selectors';
import { getSegmentRecordId } from '../utils';
import useRoute from '../hooks/useRoute';
import useSimplificationTolerance from '../../lines/hooks/useSimplificationTolerance';
import { RoutingPoint } from '../types';

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
		style = stylePathSegment;
	}

	if (!coords || !style) {
		return undefined;
	}

	return (
		<LayerPath
			key={segmentRecordId}
			coordinates={coords}
			style={style}
		/>
	);
};

const Segments: FC<{
	points?: RoutingPoint[];
}> = ({ points }) => {
	const simplify = useSimplificationTolerance();
	return (
		<ReindexScope order={300}>
			<SharedLayer>
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
			</SharedLayer>
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
const stylePathSegment: GeometryStyle = {
	strokeColor: '#00ff00',
	strokeWidth: 5,
};

export default RoutingMapView;
