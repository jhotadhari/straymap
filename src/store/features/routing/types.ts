/**
 * External dependencies
 */
import { GetTrackParams } from 'react-native-brouter';
import { Point, GeoJsonProperties } from 'geojson';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { Location } from 'react-native-mapsforge-vtm';

export type RoutingProfile = {
	fast: GetTrackParams['fast'];
	v: GetTrackParams['v'];
};

export type RoutingPoint = {
	id: number;
	timestamp: string;
	geometry: Point;
	profile: RoutingProfile;
};

export type RoutingSegment = {
	fromId: number;
	toId: number;
	positions?: Location[];
	isFetching?: boolean;
	errorMsg?: string;
};

export interface Route {
	id: number;
	timestamp: string;
	point_order: number[];
	line_id: number | null;
	points: RoutingPoint[];
}







export type RoutingTriggeredSegment = {
	index: number;
	nearestPoint: Location;
};

export type NearestSimplifiedCoord = {
	segmentIndex: number;
	featureIndex: number;
	distanceToPoint: number;
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
