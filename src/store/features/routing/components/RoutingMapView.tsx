/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { midpoint } from '@turf/turf';
import {
	LayerMarker,
	Marker,
	LayerPathSlopeGradient,
	MapContainer,
	LayerPath,
} from 'react-native-mapsforge-vtm';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
	setMarkerLayerUuid,
	setPathLayerUuids,
	setTriggeredMarkerIdx,
	setTriggeredSegment,
} from '../slice';
import {
	selectIsRouting,
	selectMovingPointIdx,
	selectPathLayerUuids,
	selectSegments,
} from '../selectors';
import { getSegmentRecordId } from '../utils';
import useRoutingPoints from '../hooks/useRoutingPoints';

const RoutingMapView = () => {
	const dispatch = useAppDispatch();

	const points = useRoutingPoints();

	const segments = useAppSelector(selectSegments);

	const pathLayerUuids = useAppSelector(selectPathLayerUuids);

	const movingPointIdx = useAppSelector(selectMovingPointIdx);

	if (!points.length) {
		return null;
	}

	return (
		<MapContainer.View>
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
					].map((arr) => ({
						lng: arr[0],
						lat: arr[1],
						...(arr.length > 2 && { alt: arr[2] }),
					}));

					if (!segment || segment?.isFetching) {
						return (
							<LayerPath
								key={segmentRecordId}
								positions={placeholderPositions}
								style={{
									strokeColor: '#0000ff',
									strokeWidth: 3,
								}}
							/>
						);
					} else {
						const center = midpoint(fromPoint.geometry, toPoint.geometry);
						return (
							<MapContainer.View key={segmentRecordId}>
								<LayerPath
									positions={placeholderPositions}
									style={{
										strokeColor: '#ff0000',
										strokeWidth: 3,
									}}
								/>
								<LayerMarker>
									<Marker
										position={{
											lng: center.geometry.coordinates[0],
											lat: center.geometry.coordinates[1],
										}}
										symbol={{
											text: 'Error',
											textMargin: 20,
											fillColor: '#ff0000',
											strokeColor: '#000000',
										}}
									/>
								</LayerMarker>
							</MapContainer.View>
						);
					}
				} else {
					return (
						<LayerPathSlopeGradient
							key={segmentRecordId}
							onCreate={(response) => {
								if (response?.uuid && setPathLayerUuids) {
									dispatch(
										setPathLayerUuids([
											...(pathLayerUuids || []),
											response.uuid,
										])
									);
								}
							}}
							onRemove={(response) => {
								const idx = pathLayerUuids?.findIndex(
									(routingPathLayerUuid) => routingPathLayerUuid === response.uuid
								);
								if (idx && idx > -1 && pathLayerUuids && setPathLayerUuids) {
									const newRoutingPathLayerUuids = [...pathLayerUuids];
									newRoutingPathLayerUuids.splice(idx, 1);
									dispatch(setPathLayerUuids(newRoutingPathLayerUuids));
								}
							}}
							positions={segment.positions}
							style={{
								strokeWidth: 5,
							}}
							onTrigger={(response) => {
								dispatch(
									setTriggeredSegment({
										index,
										nearestPoint: response.nearestPoint,
									})
								);
							}}
						/>
					);
				}
			})}

			{points.length > 0 && (
				<LayerMarker
					onCreate={(response) =>
						response.uuid ? dispatch(setMarkerLayerUuid(response.uuid)) : null
					}
					onRemove={() => dispatch(setMarkerLayerUuid(null))}
				>
					{[...points].map((point, index) => (
						<Marker
							key={point.id}
							position={{
								lng: point.geometry.coordinates[0],
								lat: point.geometry.coordinates[1],
							}}
							symbol={{
								text: index + 1 + '',
								textMargin: 15,
								...(index === movingPointIdx && {
									fillColor: '#dddddd',
									strokeColor: '#111111',
								}),
							}}
							onTrigger={() => {
								dispatch(setTriggeredMarkerIdx(index));
							}}
						/>
					))}
				</LayerMarker>
			)}

			{/* <NearestToLine/> */}
		</MapContainer.View>
	);
};

export default RoutingMapView;
