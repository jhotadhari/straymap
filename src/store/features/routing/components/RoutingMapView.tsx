/**
 * External dependencies
 */
import React from 'react';
import { midpoint } from '@turf/turf';
import { GeometryStyle, Marker, LayerPath } from 'react-native-mapsforge-vtm';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectSegments } from '../selectors';
import { getSegmentRecordId } from '../utils';
import useRoute from '../hooks/useRoute';

const RoutingMapView = () => {
	const { points } =
		useRoute([
			'points',
		]) || {};

	const segments = useAppSelector(selectSegments);

	if (!points || !points.length) {
		return null;
	}

	return (
		<>
			{[...points].map((fromPoint, index) => {
				const segment = Object.values(segments).find((seg) => seg.fromId === fromPoint.id);

				const toPoint = get(points, index + 1);

				if (!toPoint) {
					return undefined;
				}

				const segmentRecordId = getSegmentRecordId({
					fromId: fromPoint.id,
					toId: toPoint.id,
				});

				if (
					!segment ||
					segment?.isFetching ||
					(segment?.positions?.length ?? 0) < 2 ||
					segment?.errorMsg
				) {
					const placeholderPositions = [
						fromPoint?.geometry.coordinates,
						toPoint?.geometry.coordinates,
					];

					if (!segment || segment?.isFetching) {
						return (
							<LayerPath
								key={segmentRecordId}
								coordinates={placeholderPositions}
								style={stylePathFetching}
							/>
						);
					} else {
						const center = midpoint(fromPoint.geometry, toPoint.geometry);
						return (
							<React.Fragment key={segmentRecordId}>
								<LayerPath
									coordinates={placeholderPositions}
									style={stylePathError}
								/>
								<Marker
									position={center.geometry.coordinates}
									symbol={{
										text: 'Error',
										textMargin: 20,
										fillColor: '#ff0000',
										strokeColor: '#000000',
									}}
								/>
							</React.Fragment>
						);
					}
				} else {
					return (
						<LayerPath
							key={segmentRecordId}
							coordinates={segment.positions}
							style={stylePathSegment}
						/>
					);
				}
			})}

			{points.length > 0 &&
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

			{/* <NearestToLine/> */}
		</>
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
