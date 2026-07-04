/**
 * Internal dependencies
 */
import { AppFeature } from '../../types';
import appearance from './appearance';
import baseMap from './baseMap';
import dashboard from './dashboard';
import dbLoader from './dbLoader';
import dirs from './dirs';
import drawers from './drawers';
import general from './general';
import lang from './lang';
import gnss from './gnss';
import lines from './lines';
import routing from './routing';
import trackRecording from './trackRecording';
import ui from './ui';
import updater from './updater';
import { featureRegistry } from './FeatureRegistry';

const features = {
	appearance,
	baseMap,
	dashboard,
	dbLoader,
	dirs,
	drawers,
	general,
	gnss,
	lang,
	lines,
	routing,
	trackRecording,
	ui,
	updater,
} as { [featureKey: string]: AppFeature };

// Populate the registry so consumers can discover extension points.
featureRegistry.registerAll(features);

export default features;
