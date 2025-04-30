/**
 * External dependencies
 */
import React, { useContext } from 'react';

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
import type {
    // NearestSimplifiedCoord,
    RoutingSegment
} from '../types';
import { RoutingContext } from '../Context';

const NearestToLine = () => {
    const {
        nearestSimplifiedLocation,
    } = useContext( RoutingContext );

    return nearestSimplifiedLocation ? <MapContainer.View>
        <LayerMarker>
            <Marker
                position={ nearestSimplifiedLocation }
            />
        </LayerMarker>
    </MapContainer.View> : null;
};

const RoutingMapView = () => {

    const {
        isRouting,
        points,
        segments,
        setSegments,
        movingPointIdx,
        setMarkerLayerUuid,
        pathLayerUuids,
        setPathLayerUuids,
        setTriggeredMarkerIdx,
        setTriggeredSegment,
    } = useContext( RoutingContext );

    return isRouting ? <MapContainer.View>

        { segments && segments.length > 0 && [...segments].map( ( segment, index ) => {
            if (
                ! segment.positions
                || ! segment.positions.length
                || segment?.isFetching
                || ! points
            ) {
                return null;
            }
            const fromPointIdx = points.findIndex( point => segment.fromKey === point.key );
            const toPointIdx = points.findIndex( point => segment.toKey === point.key );
            if (
                -1 === fromPointIdx
                || -1 === toPointIdx
                || toPointIdx !== fromPointIdx + 1
            ) {
                return null;
            }

            return <LayerPathSlopeGradient
                key={ segment.key }
                responseInclude={ {
                    // coordinates: 1,
                    coordinatesSimplified: 1,
                } }
                onCreate={ response => {
                    if ( response?.uuid && setPathLayerUuids ) {
                        setPathLayerUuids( [...( pathLayerUuids || [] ), response.uuid] );
                    }
                    if ( response?.coordinatesSimplified && setSegments ) {
                        const newSegments = [...segments];
                        const newSegment: RoutingSegment = {
                            ...segment,
                            coordinatesSimplified: response.coordinatesSimplified,
                        };
                        newSegments.splice( index, 1, newSegment );
                        setSegments( newSegments );
                    }
                } }
                onRemove={ response => {
                    const idx = pathLayerUuids?.findIndex( routingPathLayerUuid => routingPathLayerUuid === response.uuid );
                    if ( idx && idx > -1 && pathLayerUuids && setPathLayerUuids ) {
                        const newRoutingPathLayerUuids = [...pathLayerUuids];
                        newRoutingPathLayerUuids.splice( idx, 1 );
                        setPathLayerUuids( newRoutingPathLayerUuids );
                    }
                } }
                positions={ segment.positions }
                style={ {
                    strokeWidth: 5,
                } }
                onTrigger={ response => {
                    setTriggeredSegment && setTriggeredSegment( {
                        index,
                        nearestPoint: response.nearestPoint
                    } );
                } }
            />;
        } ) }

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

        { points && points.length > 0 && <LayerMarker
            onCreate={ response => response.uuid && setMarkerLayerUuid ? setMarkerLayerUuid( response.uuid ) : null }
            onRemove={ () => setMarkerLayerUuid && setMarkerLayerUuid( null ) }
        >
            { [...points].map( ( point, index ) => <Marker
                key={ point.key }
                position={ point.location }
                symbol={ {
                    text: index + 1 + '',
                    textMargin: 15,
                    ...( index === movingPointIdx && { fillColor: '#dddddd', strokeColor: '#111111' } ),
                } }
                onTrigger={ () => {
                    setTriggeredMarkerIdx && setTriggeredMarkerIdx( index );
                } }
            /> ) }
        </LayerMarker> }

        {/* <NearestToLine/> */}

    </MapContainer.View> : null;
};

export default RoutingMapView;