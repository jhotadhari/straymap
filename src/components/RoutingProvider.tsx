/**
 * External dependencies
*/
import {
    ReactNode,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { pick } from 'lodash-es';
import rnUuid from 'react-native-uuid';
import { getTrackFromParams, type GetTrackParams } from 'react-native-brouter';

/**
 * Internal dependencies
*/
import { parseSerialized, runAfterInteractions, sortArrayByOrderArray } from '../utils';
import { RoutingSegment, RoutingTriggeredSegment, type RoutingPoint } from '../types';
import { RoutingContext } from "../Context";

type FeatureGeometry = {
    type: string;
    coordinates: ( number[] )[];
};

type FeatureProperties = {
    cost: string;
    creator: string;
    "filtered ascend": string;
    // messages: any[]	// ???
    name: string;
    "plain-ascend": string;
    times: number[];
    "total-energy": string;
    "total-time": string;
    "track-length": string;
};

type Feature = {
    type: string;
    geometry: FeatureGeometry;
    properties: FeatureProperties;
};

type JSONTracKParsed = {
    type: string;
    features: Feature[];
};

// Remove unused segments
const filterSegments = ( segments: RoutingSegment[], points: RoutingPoint[], sort?: boolean ): RoutingSegment[] => {
    if ( ! points || ! points.length ) {
        return [];
    }

    const segmentIdxsDelete = [...segments].map( ( segment, index ) => {
        const fromPointIdx = points.findIndex( point => segment.fromKey === point.key );
        const toPointIdx = points.findIndex( point => segment.toKey === point.key );
        if (
            -1 === fromPointIdx
            || -1 === toPointIdx
            || toPointIdx !== fromPointIdx + 1
        ) {
            return index;
        }
        return false;
    } ).filter( a => false !== a );

    const newSegments = segmentIdxsDelete.length > 0
        ? [...segments].filter( ( _, index ) => ! segmentIdxsDelete.includes( index ) )
        : [...segments];

    return sort
        ? sortArrayByOrderArray( newSegments, [...points].map( point => point.key ), 'fromKey' ) as RoutingSegment[]
        : newSegments;
};

const RoutingProvider = ( {
    children,
} : {
    children: ReactNode;
} ) => {

    const [savedExported,setSavedExported] = useState( {
        saved: false,
        exported: false,
    } );
    const [isRouting,setIsRouting] = useState<boolean>( false );
    const [points,setPoints] = useState<RoutingPoint[]>( [] );
    const [segments,setSegments] = useState<RoutingSegment[]>( [] );

    const [movingPointIdx,setMovingPointIdx] = useState<undefined | number>( undefined );

    const [markerLayerUuid, setMarkerLayerUuid] = useState<null | string>( null );
    const [pathLayerUuids, setPathLayerUuids] = useState<null | string[]>( null );
    const [triggeredMarkerIdx, setTriggeredMarkerIdx] = useState<undefined | number>( undefined );
    const [triggeredSegment, setTriggeredSegment] = useState<undefined | RoutingTriggeredSegment>( undefined );

    const getNewSegments = useCallback( () => {
        return [...points].reduce( ( newSegmentsPromise, point, index ) => {
            return newSegmentsPromise.then( ( newSegments ) => {
                return new Promise( ( resolve ) => {
                    if ( points.length > index + 1 ) {

                        let segmentIndex = segments.findIndex( segment =>
                            segment.fromKey === point.key
                            && segment.toKey === points[index+1].key
                        );

                        if ( -1 === segmentIndex || ( ! segments[segmentIndex].isFetching && ! segments[segmentIndex].positions ) ) {

                            let newSegment: RoutingSegment = {
                                key: rnUuid.v4(),
                                fromKey: point.key,
                                toKey:  points[index+1].key,
                                isFetching: true,
                            };
                            if ( -1 === segmentIndex ) {
                                newSegments = [...newSegments, newSegment];
                                segmentIndex = newSegments.length - 1;
                            } else {
                                newSegments.splice( segmentIndex, 1, newSegment );
                            }
                            setSegments( filterSegments( newSegments, points ) );

                            const params : GetTrackParams = {
                                lonlats: [
                                    Object.values( pick( point.location, ['lng','lat'] ) ).join( ',' ),
                                    Object.values( pick( points[index+1].location, ['lng','lat'] ) ).join( ',' ),
                                ].join( '|' ),
                                trackFormat: 'json',
                                fast: false,
                                v: 'bicycle',
                            };

                            runAfterInteractions( () => {
                                setTimeout( () => getTrackFromParams( params ).then( ( result: string ) => {
                                    const parsed : false | JSONTracKParsed = parseSerialized( result ) as false | JSONTracKParsed;
                                    if ( parsed && parsed.features ) {
                                        newSegment = {
                                            ...newSegment,
                                            positions: [...parsed.features].map( feature => [...feature.geometry.coordinates].map( coord => ( {
                                                lng: coord[0],
                                                lat: coord[1],
                                                alt: coord[2],
                                            } ) ) ).flat(),
                                            isFetching: false,
                                        }
                                        newSegments.splice( segmentIndex, 1, newSegment );
                                        resolve( newSegments );
                                    } else {
                                        newSegment = {
                                            ...newSegment,
                                            isFetching: false,
                                            errorMsg: result,
                                        }
                                        newSegments.splice( segmentIndex, 1, newSegment );
                                        resolve( newSegments );
                                    }
                                } ).catch( ( e: any ) => {
                                    newSegment = {
                                        ...newSegment,
                                        isFetching: false,
                                        errorMsg: e?.userInfo?.errorMsg,
                                    }
                                    newSegments.splice( segmentIndex, 1, newSegment );
                                    resolve( newSegments );
                                } ), 0 === index ? 0 : 400 );
                            }, 0 === index ? 0 : 100 );
                        } else {
                            resolve( newSegments );
                        }
                    } else {
                        resolve( newSegments );
                    }
                } );

            } );
        }, Promise.resolve( [...segments] ) );
    }, [points, segments] );

    useEffect( () => {
        getNewSegments().then( ( newSegments: RoutingSegment[] ) => {
            setSegments( filterSegments( newSegments, points ) );
        } );
    }, [points] );

    useEffect( () => {
        if ( ! isRouting && ( segments.length || points.length || undefined !== movingPointIdx ) ) {
            setSegments( [] );
            setPoints( [] );
            setMovingPointIdx( undefined );
        }
        if ( isRouting ) {
            setSavedExported( {
                saved: false,
                exported: false,
            } );
        }
    }, [isRouting] );

    return <RoutingContext.Provider value={ {
        savedExported,
        setSavedExported,
        movingPointIdx,
        setMovingPointIdx,
        isRouting,
        setIsRouting,
        points,
        setPoints,
        segments: filterSegments( segments, points ),
        setSegments,
        markerLayerUuid,
        setMarkerLayerUuid,
        pathLayerUuids,
        setPathLayerUuids,
        triggeredMarkerIdx,
        setTriggeredMarkerIdx,
        triggeredSegment,
        setTriggeredSegment,
    } } >
        { children }
    </RoutingContext.Provider>;

};


export default RoutingProvider;