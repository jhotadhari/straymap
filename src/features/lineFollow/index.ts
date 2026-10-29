/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized, selectIsFollowing } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import distanceToDestination from './dashboardWidgets/distanceToDestination';
import distanceCovered from './dashboardWidgets/distanceCovered';
import climbToDestination from './dashboardWidgets/climbToDestination';
import descentToDestination from './dashboardWidgets/descentToDestination';
import FollowLineSource from './mapContextMenuSources/FollowLineSource';

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	modes: ['lineFollow'],
	selectActiveModes: (state: any) => (selectIsFollowing(state) ? ['lineFollow'] : []),
	dashboardWidgets: [
		distanceToDestination,
		distanceCovered,
		climbToDestination,
		descentToDestination,
	],
	mapContextMenuSources: [
		{
			key: 'lineFollowLine',
			press: 'long',
			priority: 210,
			SourceComponent: FollowLineSource,
		},
	],
};
