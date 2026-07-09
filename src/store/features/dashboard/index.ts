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
import SettingsDashboard from './uiItems/SettingsDashboard';
import centerAltitude from './dashboardWidgets/centerAltitude';
import centerCoordinates from './dashboardWidgets/centerCoordinates';
import spacer from './dashboardWidgets/spacer';
import zoomLevel from './dashboardWidgets/zoomLevel';
import { DashboardWrapped } from './appOverlays/Dashboard';

// Wrapper so DashboardWrapped doesn't need the 'position' prop from AppView
const DashboardBottom: FC = () =>
	React.createElement(DashboardWrapped, {
		position: 'bottom',
	});

export default {
	selectInitialized,
	initializeFromStorage,
	translation: {
		de,
		en,
		es,
		pt,
	},
	uiItems: [
		{
			key: 'dashboard',
			label: 'ui.items.dashboard',
			icon: ({ color, style }: { color: string; style: any }) =>
				React.createElement(MaterialIcons, { style, name: 'dashboard', size: 25, color }),
			Component: SettingsDashboard,
		},
	],
	dashboardWidgets: [
		centerAltitude,
		centerCoordinates,
		spacer,
		zoomLevel,
	],
	settingsPages: [
		{
			key: 'dashboard',
			uiItemKey: 'dashboard',
			priority: 2200,
		}
	],
	appOverlays: [
		{
			key: 'dashboard',
			Component: DashboardBottom,
			priority: 100,
		},
	],
};
