/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectIsRecording } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import { onSetDbPath } from './slice';
import TrackRecordingControl from './components/TrackRecordingControl';
import trackingStats from './elements/trackingStats';
import TrackRecordingMapView from './components/TrackRecordingMapView';
import trackRecordingDrawerItem from './drawerItems/trackRecordingDrawerItem';

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
	modes: ['trackRecording'],
	selectActiveModes: (state: any) =>
		selectIsRecording(state) ? ['trackRecording'] : [],
	settingsControls: [
		{
			key: 'trackRecording',
			label: 'trackRecording.title',
			Control: TrackRecordingControl,
			priority: 200,
		},
	],
	dashboardElements: [trackingStats],
	mapViewComponents: [
		{
			key: 'trackRecordingMapView',
			Component: TrackRecordingMapView,
			placement: 'inside-map',
			priority: 310,
		},
	],
	drawerItems: [trackRecordingDrawerItem],
};
