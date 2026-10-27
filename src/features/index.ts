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
import bottomDrawer from './bottomDrawer';
import chart from './chart';
import general from './general';
import importFeature from './import';
import lang from './lang';
import lines from './lines';
import mapContextMenu from './mapContextMenu';
import measure from './measure';
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
	bottomDrawer,
	chart,
	general,
	import: importFeature,
	lang,
	lines,
	mapContextMenu,
	measure,
	routing,
	ui,
	updater,
	gnss,
	trackRecording,
} as { [featureKey: string]: AppFeature };

// Populate the registry so consumers can discover extension points.
featureRegistry.registerAll(features);

export default features;
