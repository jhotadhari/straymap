/**
 * Internal dependencies
 */
import { AppFeature } from '../types';
import appearance from './appearance';
import baseMap from './baseMap';
import dashboard from './dashboard';
import dbLoader from './dbLoader';
import dirs from './dirs';
import drawers from './drawers';
import general from './general';
import importFeature from './import';
import lang from './lang';
import lines from './lines';
import routing from './routing';
import gnss from './gnss';
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
	import: importFeature,
	lang,
	lines,
	routing,
	ui,
	updater,
	...(__DEV__ && {
		gnss,
		trackRecording,
	}),
} as { [featureKey: string]: AppFeature };

// Populate the registry so consumers can discover extension points.
featureRegistry.registerAll(features);

export default features;
