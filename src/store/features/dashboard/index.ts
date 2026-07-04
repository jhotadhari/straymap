/**
 * Internal dependencies
 */
import React, { FC } from 'react';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import { initializeFromStorage } from './connectStorage';
import { selectInitialized } from './selectors';
import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';
import es from './assets/i18n/es.json';
import pt from './assets/i18n/pt.json';
import SettingsDashboard from '../ui/components/SettingsDashboard';
import centerAltitude from './elements/centerAltitude';
import centerCoordinates from './elements/centerCoordinates';
import spacer from './elements/spacer';
import zoomLevel from './elements/zoomLevel';
import { DashboardWrapped } from './components/Dashboard';

// Wrapper so DashboardWrapped doesn't need the 'position' prop from AppView
const DashboardBottom: FC = () => React.createElement(DashboardWrapped, { position: 'bottom' });

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	settingsItems: [
		{
			key: 'dashboard',
			label: 'ui.items.dashboard',
			icon: ({ color, style }: { color: string; style: any }) =>
				React.createElement(MaterialIcons, { style, name: 'dashboard', size: 25, color }),
			Component: SettingsDashboard,
			priority: 40,
		},
	],
	dashboardElements: [centerAltitude, centerCoordinates, spacer, zoomLevel],
	mapViewComponents: [
		{
			key: 'dashboard',
			Component: DashboardBottom,
			placement: 'sibling-overlay',
			priority: 400,
		},
	],
};
