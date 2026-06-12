/**
 * External dependencies
 */
import React from 'react';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	LayerMarker,
	Marker,
	LayerPathSlopeGradient,
	MapContainer,
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
import { getCoordsFromRouting, getSegmentRecordId } from '../utils';

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

				if( segment?.isFetching ) {
					// ??? show placeholder line instead
					return undefined;
				}

				if ((segment?.positions?.length ?? 0) < 2 || segment?.errorMsg ) {
					// ??? show error placeholder line instead
					return undefined;
				}

				const segmentRecordId = getSegmentRecordId(segment);

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
