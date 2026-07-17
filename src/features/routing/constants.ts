/**
 * Internal dependencies
 */
import { BrouterOptions, RoutingProfile, StraightLineOptions } from './types';

export const DEFAULT_OPTIONS_BROUTER: BrouterOptions = {
	fast: true,
	v: 'motorcar',
};
export const DEFAULT_OPTIONS_STRAIGHT_LINE: StraightLineOptions = {
	interval: 1000,
};

export const DEFAULT_PROFILE: RoutingProfile = {
	provider: 'brouter',
	options: DEFAULT_OPTIONS_BROUTER,
};
