/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { midpoint } from '@turf/turf';
import {
	LayerMarker,
	Marker,
	LayerPathSlopeGradient,
	MapContainer,
	LayerPath,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
	setMarkerLayerUuid,
	setPathLayerUuids,
	setTriggeredMarkerIdx,
	setTriggeredSegment,
} from '../routingSlice';
import {
	selectIsRouting,
	selectMovingPointIdx,
	selectPathLayerUuids,
	selectPoints,
	selectSegments,
} from '../selectors';
import { getSegmentRecordId } from '../utils';

// const NearestToLine = () => {
// 	const { nearestSimplifiedLocation } = useContext(RoutingContext);

// 	return nearestSimplifiedLocation ? (
// 		<MapContainer.View>
// 			<LayerMarker>
// 				<Marker position={nearestSimplifiedLocation} />
// 			</LayerMarker>
// 		</MapContainer.View>
// 	) : null;
// };

const RoutingMapView = () => {
	const dispatch = useAppDispatch();

	const isRouting = useAppSelector(selectIsRouting);
	const points = useAppSelector(selectPoints);
	const segments = useAppSelector(selectSegments);

	const pathLayerUuids = useAppSelector(selectPathLayerUuids);

	const movingPointIdx = useAppSelector(selectMovingPointIdx);

	if (!isRouting) {
		return null;
	}

	return (
		<MapContainer.View>
			{Object.values(segments).map((segment, index) => {
				const segmentRecordId = getSegmentRecordId(segment);

				if (
					segment?.isFetching ||
					(segment?.positions?.length ?? 0) < 2 ||
					segment?.errorMsg
				) {
					const fromPoint = points.find((point) => segment.fromId === point.id);
					const toPoint = points.find((point) => segment.toId === point.id);
					if (!fromPoint || !toPoint) {
						return undefined;
					}

					const placeholderPositions = [
						fromPoint?.geometry.coordinates,
						toPoint?.geometry.coordinates,
					].map((arr) => ({
						lng: arr[0],
						lat: arr[1],
						...(arr.length > 2 && { alt: arr[2] }),
					}));

					if (segment?.isFetching) {
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
				}

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
			})}

			{/* { undefined !== movingPointIdx && currentMapEvent?.center && points && points.length > movingPointIdx-1 && <LayerPath
            positions={[
                points[movingPointIdx-1].location,
                currentMapEvent?.center,
            ]}
            style={ {
                strokeWidth: 2,
            } }
        /> }
        { undefined !== movingPointIdx && currentMapEvent?.center && points && points.length > movingPointIdx+1 && <LayerPath
            positions={[
                points[movingPointIdx+1].location,
                currentMapEvent?.center,
            ]}
            style={ {
                strokeWidth: 2,
            } }
        /> } */}

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
