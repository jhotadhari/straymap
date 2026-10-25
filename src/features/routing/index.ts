/**
 * Internal dependencies
 */
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import { onSetDbPath } from './slice';
import { selectIsRouting, selectRoutingLineId } from './selectors';
import { SLOPE_COLOR_RAMP } from './constants';
import RoutingMapView from './mapComponents/RoutingMapView';
import routingDrawerItem from './drawerPanels/routing';
import RoutingMovingSource from './mapContextMenuSources/RoutingMovingSource';
import RoutingWaypointSource from './mapContextMenuSources/RoutingWaypointSource';
import RoutingSegmentSource from './mapContextMenuSources/RoutingSegmentSource';
import RoutingMapSource from './mapContextMenuSources/RoutingMapSource';

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
	drawerPanels: [routingDrawerItem],
	mapComponents: [
		{
			key: 'routingMapView',
			Component: RoutingMapView,
			priority: 300,
		},
	],
	mapContextMenuSources: [
		{
			key: 'routingMoving',
			press: 'long',
			SourceComponent: RoutingMovingSource,
		},
		{
			key: 'routingWaypoint',
			press: 'long',
			SourceComponent: RoutingWaypointSource,
		},
		{
			key: 'routingSegment',
			press: 'long',
			SourceComponent: RoutingSegmentSource,
		},
		{
			key: 'routingMap',
			press: 'long',
			SourceComponent: RoutingMapSource,
		},
	],
	modes: ['routing'],
	selectActiveModes: (state: any) => (selectIsRouting(state) ? ['routing'] : []),
	systemTagLabels: ['routing'],
	selectSystemLineIds: (state: any) => {
		const id = selectRoutingLineId(state);
		return { routing: id ?? null };
	},
	selectLineColorRamps: (state: any) => {
		const id = selectRoutingLineId(state);
		// The routing line renders itself (live brouter segments) via
		// LayerPathColorRamp — the declaration here drives the line-list
		// legend column only, not LinesMapView rendering.
		return id != null ? { [id]: SLOPE_COLOR_RAMP } : {};
	},
};
