/**
 * External dependencies
 */
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import { UiItem } from './types';
import SettingsMaps from './components/SettingsMaps';
import SettingsGeneral from './components/SettingsGeneral';
import SettingsAppearance from './components/SettingsAppearance';
import Settings from './components/Settings';
import About from '../../../components/About';
import SettingsDashboard from './components/SettingsDashboard';

export const uiItems: UiItem[] = [
	{
		key: 'settings',
		label: 'uiItems.settings',
		icon: 'cog',
		Component: <Settings />,
	},
	{
		key: 'about',
		label: 'uiItems.about',
		icon: 'information-variant',
		Component: <About />,
	},
	{
		key: 'maps',
		label: 'uiItems.maps',
		icon: 'map',
		Component: <SettingsMaps />,
	},
	{
		key: 'general',
		label: 'uiItems.general',
		icon: 'application-cog-outline',
		Component: <SettingsGeneral />,
	},
	{
		key: 'dashboard',
		label: 'uiItems.dashboard',
		icon: ({ color, style }) => (
			<MaterialIcons
				style={style}
				name="dashboard"
				size={25}
				color={color}
			/>
		),
		Component: <SettingsDashboard />,
	},
	{
		key: 'appearance',
		label: 'uiItems.appearance',
		icon: ({ color, style }) => (
			<MaterialIcons
				style={style}
				name="style"
				size={25}
				color={color}
			/>
		),
		Component: <SettingsAppearance />,
	},
];

export const getUiItemsByKey = (keys: string[]) => {
	return [...keys].map((key) => uiItems.find((item) => item.key === key)).filter((a) => !!a);
};
