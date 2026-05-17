/**
 * External dependencies
 */
import { GetTrackParams } from 'react-native-brouter';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { Location } from 'react-native-mapsforge-vtm';

export type RoutingPoint = {
	key: string;
	location: Location;
};

export type RoutingProfile = {
	fast: GetTrackParams['fast'];
	v: GetTrackParams['v'];
};

export interface LocationExtended extends Location {
	lng: number;
	lat: number;
	alt?: number;
	distance?: number;
	slope?: number;
	time?: number;
}

export type RoutingSegment = {
	key: string;
	fromKey: string;
	toKey: string;
	positions?: Location[];
	isFetching?: boolean;
	errorMsg?: string;
	profile: RoutingProfile;
	coordinatesSimplified?: LocationExtended[];
};

export type RoutingTriggeredSegment = {
	index: number;
	nearestPoint: Location;
};


export type NearestSimplifiedCoord = {
	segmentIndex: number;
	featureIndex: number;
	distanceToPoint: number;
};

export type RoutingStats = {
	up: number;
	down: number;
	distance: number;
};
