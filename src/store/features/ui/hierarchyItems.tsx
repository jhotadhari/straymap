import { List } from 'react-native-paper';
import { SettingsItem, MenuItem as MenuItemType } from '../../../types';
import SettingsMaps from './components/SettingsMaps';
import SettingsGeneral from './components/SettingsGeneral';
import SettingsAppearance from './components/SettingsAppearance';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Settings from './components/Settings';
import About from '../../../components/About';

export const menuItems: MenuItemType[] = [
	// {
	// 	key: 'tools',
	// 	label: 'menu.tools',
	// 	leadingIcon: 'tools',
	// 	children: [
	// 		{
	//             key: 'routing',
	// 			label: 'menu.routing',
	// 			hierarchyIncludeParents: false,
	// 			leadingIcon: 'routes',
	//             SubActivity: <About/>,
	// 		},
	// 	]
	// },
	// {
	//     key: 'egal',
	// 	label: 'menu.egal',
	// 	leadingIcon: 'progress-question',
	// 	children: [
	// 		{
	//             key: 'egalSub1',
	// 			label: 'menu.egalSub1',
	// 			leadingIcon: 'progress-question',
	//             SubActivity: <About/>,
	// 		},
	// 		{
	//             key: 'egalSub2',
	// 			label: 'menu.egalSub2',
	// 			leadingIcon: 'progress-question',
	//             SubActivity: <About/>,
	// 		},
	// 	]
	// },
	{
		key: 'settings',
		label: 'menu.settings',
		leadingIcon: 'cog',
		SubActivity: <Settings />,
	},
	{
		key: 'about',
		label: 'menu.about',
		leadingIcon: 'information-variant',
		SubActivity: <About />,
	},
];

export const settingsPages: SettingsItem[] = [
	{
		key: 'maps',
		label: 'settings.maps',
		left: (props) => (
			<List.Icon
				{...props}
				icon="map"
			/>
		),
		SubActivity: <SettingsMaps />,
	},
	{
		key: 'general',
		label: 'settings.general',
		left: (props) => (
			<List.Icon
				{...props}
				icon="application-cog-outline"
			/>
		),
		SubActivity: <SettingsGeneral />,
	},
	{
		key: 'appearance',
		label: 'settings.appearance',
		left: ({ color, style }) => (
			<MaterialIcons
				style={style}
				name="style"
				size={25}
				color={color}
			/>
		),
		SubActivity: <SettingsAppearance />,
	},
];

export const getHierarchyItemsByKey = (
	keys: string[] // eg ['menuItems.settings','settingsPages.maps']
) => {
	return [...keys]
		.map((key) => {
			return (
				menuItems.find((item) => item.key === key) ??
				settingsPages.find((item) => item.key === key)
			);
		})
		.filter((a) => !!a);
};
