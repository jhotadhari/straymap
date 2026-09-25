/**
 * External dependencies
 */
import type { VehicleMode } from 'react-native-brouter/geojson';
import { Point } from 'geojson';
import { Position } from 'react-native-mapsforge-vtm';
import { LineStats } from '../lines/types';

export type BrouterCompressionMode = 'off' | 'on' | 'auto';

export type BrouterOptions = {
	fast: boolean;
	v: VehicleMode;
	compressionMode?: BrouterCompressionMode;
	/**
	 * Absolute path or `content://` URI of a custom .brf profile file.
	 * When set, its content is sent to BRouter as `remoteProfile` and
	 * `fast`/`v` are ignored. Absent = use BRouter's built-in profiles.
	 */
	profilePath?: string;
};

export type StraightLineOptions = {
	interval: number;
};

export type RoutingProfile =
	| { provider: 'brouter'; options: BrouterOptions }
	| { provider: 'straightLine'; options: StraightLineOptions };

export type RoutingPointInheritMode = 'route' | 'prev' | 'own';

export type LastProfiles = {
	provider: RoutingProfile['provider'];
	profiles: { [provider: string]: RoutingProfile };
};

export type RoutingPoint = {
	id: number;
	geometry: Point;
	profile?: RoutingProfile;
	inheritMode?: RoutingPointInheritMode;
};

export type RoutingSegment = {
	fromId: number;
	toId: number;
	positions?: Position[];
	isFetching?: boolean;
	errorMsg?: string;
};

export interface Route {
	id: number;
	point_order: number[];
	line_id: number | null;
	stats?: LineStats;
	points: RoutingPoint[];
	profile: RoutingProfile;
}
