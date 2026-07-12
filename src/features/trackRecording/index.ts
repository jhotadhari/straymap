/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectIsRecording } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import trackingStats from './dashboardWidgets/trackingStats';
import TrackRecordingMapView from './mapComponents/TrackRecordingMapView';
import trackRecordingDrawerItem from './drawerPanels/trackRecordingDrawerItem';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	modes: ['trackRecording'],
	selectActiveModes: (state: any) => (selectIsRecording(state) ? ['trackRecording'] : []),
	dashboardWidgets: [trackingStats],
	mapComponents: [
		{
			key: 'trackRecordingMapView',
			Component: TrackRecordingMapView,
			priority: 310,
		},
	],
	drawerPanels: [trackRecordingDrawerItem],
};
