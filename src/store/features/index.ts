import { AppFeature } from '../../types';
import appearance from './appearance';
import baseMap from './baseMap';
import dashboard from './dashboard';
import dirs from './dirs';
import drawers from './drawers';
import general from './general';
import lang from './lang';
import routing from './routing';
import ui from './ui';
import updater from './updater';

export default {
	appearance,
	baseMap,
	dashboard,
	dirs,
	drawers,
	general,
	lang,
	routing,
	ui,
	updater,
} as { [featureKey: string]: AppFeature };
