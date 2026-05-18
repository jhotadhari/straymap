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





export type FeatureGeometry = {
	type: string;
	coordinates: number[][];
};

export type FeatureProperties = {
	cost: string;
	creator: string;
	'filtered ascend': string;
	// messages: any[]	// ???
	name: string;
	'plain-ascend': string;
	times: number[];
	'total-energy': string;
	'total-time': string;
	'track-length': string;
};

export type Feature = {
	type: string;
	geometry: FeatureGeometry;
	properties: FeatureProperties;
};

export type JSONTracKParsed = {
	type: string;
	features: Feature[];
};