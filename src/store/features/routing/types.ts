/**
 * External dependencies
 */
import { GetTrackParams } from 'react-native-brouter';
import { Point } from 'geojson';
import { Location } from 'react-native-mapsforge-vtm';
import { LineStats } from '../lines/types';

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
	stats?: LineStats;
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
