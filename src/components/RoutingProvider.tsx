/**
 * External dependencies
*/
import {
    ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { get, pick } from 'lodash-es';
import rnUuid from 'react-native-uuid';
import { getTrackFromParams, type GetTrackParams } from 'react-native-brouter';
import { nearestPoint } from '@turf/nearest-point';
import { featureCollection } from "@turf/helpers";
import { point as turfPoint } from "@turf/helpers";

/**
 * Internal dependencies
*/
import { getUpDown, parseSerialized, runAfterInteractions, sortArrayByOrderArray } from '../utils';
import { NearestSimplifiedCoord, RoutingSegment, RoutingTriggeredSegment, RoutingPoint, RoutingStats } from '../types';
import { MapContext, RoutingContext } from "../Context";
import { LocationExtended } from 'react-native-mapsforge-vtm';

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

const useRoutingStats = ( segments?: RoutingSegment[] ) : RoutingStats => {

    const stats = useMemo( () => segments ? [...segments].reduce( ( acc, segment ) => {
        const {
            up,
            down,
        } = getUpDown( segment?.coordinatesSimplified );

        return {
            up: acc.up + up,
            down: acc.down + down,
            distance: acc.distance + ( segment?.coordinatesSimplified
                ? segment.coordinatesSimplified[segment.coordinatesSimplified.length-1].distance || 0
                : 0
            ),
        }
    }, {
        up: 0,
        down: 0,
        distance: 0,
    } ) : {
        up: 0,
        down: 0,
        distance: 0,
    }, [segments] );
    return stats;
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

    const {
        currentMapEvent,
    } = useContext( MapContext );

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

    const [shouldSegmentsUpdate, setShouldSegmentsUpdate] = useState<number>( 0 );
    const triggerSegmentsUpdate = () => setShouldSegmentsUpdate( Math.random() );

    const lines = useMemo( () => segments ? [...segments].map( segment => segment?.coordinatesSimplified
        ? featureCollection( [...segment.coordinatesSimplified].map( coord => turfPoint( [
            coord.lng,  // ??? should be other way around. shit in react-native-mapsforge-vtm
            coord.lat,  // ??? should be other way around. shit in react-native-mapsforge-vtm
        ] ) ) )
        : false
    ) : [], [segments] );

    const stats = useRoutingStats( segments );

    const {
        nearestSimplifiedCoord,
        nearestSimplifiedLocation,
    } = ( () : {
        nearestSimplifiedCoord?: NearestSimplifiedCoord;
        nearestSimplifiedLocation?: LocationExtended;
    } => {
        if ( currentMapEvent?.center ) {
            const centerPoint = turfPoint( [currentMapEvent?.center.lng, currentMapEvent.center.lat] );
            const nearestSimplifiedCoord = [...lines].reduce( ( acc: any | number, line, index ) => {
                if ( ! line || ! currentMapEvent?.center ) {
                    return acc;
                }
                const nearest_ = nearestPoint( centerPoint, line );
                // nearest.geometry.
                if ( undefined === acc ) {
                    return {
                        segmentIndex: index,
                        featureIndex: nearest_.properties.featureIndex,
                        distanceToPoint: nearest_.properties.distanceToPoint,
                    };
                } else if (
                    nearest_?.properties?.distanceToPoint
                    && acc?.distanceToPoint
                    && nearest_.properties.distanceToPoint < acc.distanceToPoint
                ) {
                    return {
                        segmentIndex: index,
                        featureIndex: nearest_.properties.featureIndex,
                        distanceToPoint: nearest_.properties.distanceToPoint,
                    };
                } else {
                    return acc;
                }
            }, undefined );


            return {
                nearestSimplifiedCoord,
                nearestSimplifiedLocation: segments && nearestSimplifiedCoord && get( segments, [
                    nearestSimplifiedCoord.segmentIndex,
                    'coordinatesSimplified',
                    nearestSimplifiedCoord.featureIndex
                ], undefined ),
            };

        } else {
            return {
                nearestSimplifiedCoord: undefined,
                nearestSimplifiedLocation: undefined,
            };
        }
    } )();

    const updateSegmentForIndex = (
        segmentIndex: number,
        point: RoutingPoint,
        nextPoint: RoutingPoint,
        hasDelay: boolean,
        newSegments?: RoutingSegment[],
        resolve?: (value: RoutingSegment[] | PromiseLike<RoutingSegment[]>) => void,
    ) => {

        if ( -1 === segmentIndex || ( ! segments[segmentIndex].isFetching && ! segments[segmentIndex].positions ) ) {

            newSegments = newSegments ? newSegments : [...segments];

            const prevSegment = segments.find( seg => seg.toKey === point.key );

            let newSegment: RoutingSegment = {
                ...( -1 === segmentIndex && point && nextPoint ? {
                    profile: {
                        fast: prevSegment?.profile?.fast || true,   // ??? from defaults, or from previous or from cut segment
                        v: prevSegment?.profile?.v || 'motorcar',   // ??? from defaults, or from previous or from cut segment
                    },
                } : {
                    ...segments[segmentIndex],
                } ),
                key: rnUuid.v4() as string,
                fromKey: point.key,
                toKey:  nextPoint.key,
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
                    Object.values( pick( nextPoint.location, ['lng','lat'] ) ).join( ',' ),
                ].join( '|' ),
                trackFormat: 'json',
                fast: newSegment.profile.fast,
                v: newSegment.profile.v,
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
                        newSegments && newSegments.splice( segmentIndex, 1, newSegment );
                        resolve && resolve( newSegments || [] );
                    } else {
                        newSegment = {
                            ...newSegment,
                            isFetching: false,
                            errorMsg: result,
                        }
                        newSegments && newSegments.splice( segmentIndex, 1, newSegment );
                        resolve && resolve( newSegments || [] );
                    }
                } ).catch( ( e: any ) => {
                    newSegment = {
                        ...newSegment,
                        isFetching: false,
                        errorMsg: e?.userInfo?.errorMsg,
                    }
                    newSegments && newSegments.splice( segmentIndex, 1, newSegment );
                    resolve && resolve( newSegments || [] );
                } ), hasDelay ? 0 : 400 );
            }, hasDelay ? 0 : 100 );
        } else {
            resolve && resolve( newSegments || [] );
        }
    };

    const getNewSegments = useCallback( () => {
        return [...points].reduce( ( newSegmentsPromise, point, index ) => {
            return newSegmentsPromise.then( ( newSegments ) => {
                return new Promise( ( resolve ) => {
                    if ( points.length > index + 1 ) {
                        const segmentIndex = segments.findIndex( segment =>
                            segment.fromKey === point.key
                            && segment.toKey === points[index+1].key
                        );
                        updateSegmentForIndex(
                            segmentIndex,
                            point,
                            points[index+1],
                            0 !== index,
                            newSegments,
                            resolve
                        );
                    } else {
                        resolve && resolve( newSegments || [] );
                    }
                } );

            } );
        }, Promise.resolve( [...segments] ) );
    }, [points, segments] );

    useEffect( () => {
        getNewSegments().then( ( newSegments: RoutingSegment[] ) => {
            setSegments( filterSegments( newSegments, points ) );
        } );
    }, [points,shouldSegmentsUpdate] );

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
        triggerSegmentsUpdate,
        nearestSimplifiedCoord,
        nearestSimplifiedLocation,
        stats,
    } } >
        { children }
    </RoutingContext.Provider>;

};


export default RoutingProvider;