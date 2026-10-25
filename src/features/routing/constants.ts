/**
 * External dependencies
 */
import { ColorRamp } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

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

/**
 * Slope colour ramp (percent grade) used to render routing segments via
 * LayerPathColorRamp. Also registered per-line via
 * `selectLineColorRamps` so line-list colour columns can render the
 * matching legend. Keep in sync with the chart's slope ramp
 * (`src/features/chart/utils.ts` SLOPE_STOPS).
 */
export const SLOPE_COLOR_RAMP: ColorRamp = {
	unit: 'percent',
	stops: [
		{ value: -20, color: '#00004d' },
		{ value: -13, color: '#000080' },
		{ value: -7, color: '#0000ff' },
		{ value: -2, color: '#00e8ff' },
		{ value: 0, color: '#00ff00' },
		{ value: 2, color: '#FFDE02' },
		{ value: 7, color: '#ff0000' },
		{ value: 13, color: '#800000' },
		{ value: 20, color: '#4d0000' },
	],
};

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
