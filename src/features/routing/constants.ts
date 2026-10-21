/**
 * Internal dependencies
 */
import {
	BrouterOptions,
	LastProfiles,
	RoutingPointInheritMode,
	RoutingProfile,
	StraightLineOptions,
} from './types';

export const DEFAULT_INHERIT_MODE: RoutingPointInheritMode = 'route';

/**
 * Fixed simplification tolerance used for the per-segment color ramp
 * rendering and the chart coordinates. Kept in sync so the
 * rendered ramp and the chart always show the same geometry.
 */
export const ROUTING_SIMPLIFY_TOLERANCE = 0.00004;

/**
 * Screen distance (dp) within which the map center is considered to be
 * "on" a rendered segment or waypoint for the gesture-workaround actions
 * (cut segment, move/delete point at center). Mirrors the map library's
 * native gesture hit-test distance (30 px default).
 */
export const ROUTING_GESTURE_THRESHOLD_DP = 30;

export const DEFAULT_OPTIONS_BROUTER: BrouterOptions = {
	fast: true,
	v: 'motorcar',
	compressionMode: 'off',
};
export const DEFAULT_OPTIONS_STRAIGHT_LINE: StraightLineOptions = {
	interval: 100,
};

export const DEFAULT_PROFILE: RoutingProfile = {
	provider: 'brouter',
	options: DEFAULT_OPTIONS_BROUTER,
};

export const DEFAULT_LAST_PROFILES: LastProfiles = {
	provider: 'brouter',
	profiles: {
		brouter: { provider: 'brouter', options: DEFAULT_OPTIONS_BROUTER },
		straightLine: {
			provider: 'straightLine',
			options: DEFAULT_OPTIONS_STRAIGHT_LINE,
		},
	},
};
