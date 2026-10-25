/**
 * External dependencies
 */
import { ColorRamp } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectLineRamps } from './selectors';
import { RampKey } from './slice';
import { SLOPE_COLOR_RAMP } from '../routing/constants';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import { onSetDbPath } from './slice';
import LinesMapView from './mapComponents/LinesMapView';
import LinesBrowser from './uiItems/LinesBrowser';
import TagsBrowser from './uiItems/TagsBrowser';
import linesDrawerItem from './drawerPanels/lines';
import LineEditModalWrapper from './components/LineEditModalWrapper';
import TagBadgeModeControl from './components/controls/TagBadgeModeControl';
import UseSimplificationControl from './components/controls/UseSimplificationControl';
import LinesIcon from './components/LinesIcon';
import LinesLineSource from './mapContextMenuSources/LinesLineSource';
import LineColorPickerModal from './components/LineColorPickerModal';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	onSetDbPath,
	uiItems: [
		{
			key: 'linesBrowser',
			label: 'lines.linesBrowser',
			icon: LinesIcon,
			Component: LinesBrowser,
		},
		{
			key: 'tagEdit',
			label: 'lines.tagsBrowser',
			icon: 'tag-outline',
			Component: TagsBrowser,
		},
	],
	drawerPanels: [linesDrawerItem],
	mapComponents: [
		{
			key: 'linesMapView',
			Component: LinesMapView,
			priority: 200,
		},
		{
			key: 'lineEditModal',
			Component: LineEditModalWrapper,
			priority: 500,
		},
		{
			key: 'lineColorPickerModal',
			Component: LineColorPickerModal,
			priority: 500,
		},
	],
	mapContextMenuSources: [
		{
			key: 'linesLine',
			press: 'long',
			priority: 200,
			SourceComponent: LinesLineSource,
		},
	],
	settingsPages: [
		{
			key: 'linesBrowser',
			uiItemKey: 'linesBrowser',
		},
		{
			key: 'tagEdit',
			uiItemKey: 'tagEdit',
		},
	],
	settingsControls: [
		{
			key: 'tagBadgeMode',
			label: 'lines.tagBadgeMode',
			Control: TagBadgeModeControl,
		},
		{
			key: 'useSimplification',
			label: 'lines.useSimplification',
			Control: UseSimplificationControl,
		},
	],
	systemTagLabels: ['imported'],
	selectLineColorRamps: (state: any) => {
		// User-assigned per-line ramps (single-line UI only — no bulk
		// actions, each ramp line costs its own geometry query + native
		// color-ramp layer). Unknown ramp keys from older/stale persisted
		// state are skipped.
		const lineRamps = selectLineRamps(state);
		const colorRamps: Record<number, ColorRamp> = {};
		for (const [lineId, rampKey] of Object.entries(lineRamps)) {
			const colorRamp = LINE_RAMPS[rampKey as RampKey];
			if (colorRamp) {
				colorRamps[Number(lineId)] = colorRamp;
			}
		}
		return colorRamps;
	},
};

/**
 * User-selectable ramp kinds. The slope ramp is shared with the routing
 * feature (keep in sync with the chart's SLOPE_STOPS).
 */
const LINE_RAMPS: Record<RampKey, ColorRamp> = {
	slope: SLOPE_COLOR_RAMP,
};
