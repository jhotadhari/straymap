
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

const useRouting = () => {

	const [points,setPoints] = useState<RoutingPoint[]>( [] );
	const [segments,setSegments] = useState<RoutingSegment[]>( [] );

	useEffect( () => {
		let newSegments = [...segments];
		[...points].map( ( point, index ) => {

			// if ( points.length > index + 1 && ! point.isFetching && ! point.positions ) {
			if ( points.length > index + 1 ) {

				let segmentIndex = segments.findIndex( segment =>
					segment.fromId === point.id
					&& segment.toId === points[points.length-1].id
				);

				if ( -1 === segmentIndex || ! segments[segmentIndex].isFetching && ! segments[segmentIndex].positions ) {

					let newSegment = {
						...( -1 === segmentIndex ? {} : segments[segmentIndex] ),
						fromId: point.id,
						toId:  points[points.length-1].id,
						isFetching: true,
					};
					if ( -1 === segmentIndex ) {
						newSegments = [...newSegments, newSegment];
						segmentIndex = newSegments.length - 1;
					} else {
						newSegments.splice( segmentIndex, 1, newSegment );
					}
					setSegments( newSegments );

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
							// let newSegments = [...segments]
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
							setSegments( newSegments );
						} else {
							newSegment = {
								...newSegment,
								isFetching: false,
								errorMsg: result,
							}
							newSegments.splice( segmentIndex, 1, newSegment );
							setSegments( newSegments );
						}
					} ).catch( ( e: any ) => {
						newSegment = {
							...newSegment,
							isFetching: false,
							errorMsg: e?.userInfo?.errorMsg,
						}
						newSegments.splice( segmentIndex, 1, newSegment );
						setSegments( newSegments );
					} );
				}
			}
		} );

		// Remove unused segments
		const segmentIdxsDelete = [...newSegments].map( ( segment, index ) => {
			if (
				-1 === points.findIndex( point => segment.fromId === point.id )
				|| -1 === points.findIndex( point => segment.toId === point.id )
			) {
				return index;
			}
			return false;
		} ).filter( a => false !== a );
		if ( segmentIdxsDelete.length > 0 ) {
			setSegments(
				[...newSegments].filter( ( segment, index ) => ! segmentIdxsDelete.includes( index ) )
			);
		}

	}, [points] );

	return {
		points,
		setPoints,
		segments,
	};
};

export default useRouting;
