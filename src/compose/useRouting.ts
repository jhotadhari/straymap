
/**
 * External dependencies
 */
import {
	useEffect,
	useState,
} from 'react';
import { getTrackFromParams, type GetTrackParams } from 'react-native-brouter';

/**
 * Internal dependencies
 */
import { pick } from 'lodash-es';
import { parseSerialized } from '../utils';
import { RoutingSegment, type RoutingPoint } from '../types';
import { Location } from 'react-native-mapsforge-vtm';

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
const filterSegments = ( segments: RoutingSegment[], points: RoutingPoint[] ) => {
	if ( ! points || ! points.length ) {
		return [];
	}

	const segmentIdxsDelete = [...segments].map( ( segment, index ) => {
		const fromPointIdx = points.findIndex( point => segment.fromId === point.id );
		const toPointIdx = points.findIndex( point => segment.toId === point.id );
		if (
			-1 === fromPointIdx
			|| -1 === toPointIdx
			|| toPointIdx !== fromPointIdx + 1
		) {
			return index;
		}
		return false;
	} ).filter( a => false !== a );

	if ( segmentIdxsDelete.length > 0 ) {
		return segments.filter( ( segment, index ) => ! segmentIdxsDelete.includes( index ) );
	} else {
		return segments;
	}
};

const useRouting = () => {

	const [points,setPoints] = useState<RoutingPoint[]>( [] );
	const [segments,setSegments] = useState<RoutingSegment[]>( [] );

	useEffect( () => {
		let newSegments = [...segments];
		[...points].map( ( point, index ) => {

			if ( points.length > index + 1 ) {

				let segmentIndex = segments.findIndex( segment =>
					segment.fromId === point.id
					&& segment.toId === points[index+1].id
				);

				if ( -1 === segmentIndex || ( ! segments[segmentIndex].isFetching && ! segments[segmentIndex].positions ) ) {

					let newSegment: RoutingSegment = {
						fromId: point.id,
						toId:  points[index+1].id,
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

					getTrackFromParams( params ).then( ( result: string ) => {
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
							setSegments( filterSegments( newSegments, points ) );
						} else {
							newSegment = {
								...newSegment,
								isFetching: false,
								errorMsg: result,
							}
							newSegments.splice( segmentIndex, 1, newSegment );
							setSegments( filterSegments( newSegments, points ) );
						}
					} ).catch( ( e: any ) => {
						newSegment = {
							...newSegment,
							isFetching: false,
							errorMsg: e?.userInfo?.errorMsg,
						}
						newSegments.splice( segmentIndex, 1, newSegment );
						setSegments( filterSegments( newSegments, points ) );
					} );
				}
			}
		} );
	}, [points] );

	return {
		points,
		setPoints,
		segments,
	};
};

export default useRouting;
