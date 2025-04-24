import { List } from "react-native-paper";
import { SettingsItem, MenuItem as MenuItemType, HierarchyItem } from "./types";
import SettingsMaps from "./components/SettingsMaps";
import SettingsGeneral from "./components/SettingsGeneral";
import SettingsAppearance from "./components/SettingsAppearance";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Settings from "./components/Settings";
import About from "./components/About";
import { Dispatch, SetStateAction } from "react";

export const menuItems : MenuItemType[] = [
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
    //             SubActivity: <EgalTest/>,
	// 		},
	// 		{
    //             key: 'egalSub2',
	// 			label: 'menu.egalSub2',
	// 			leadingIcon: 'progress-question',
    //             SubActivity: <EgalTest/>,
	// 		},
	// 	]
	// },
	{
        key: 'settings',
		label: 'menu.settings',
		leadingIcon: 'cog',
		SubActivity: <Settings/>,
	},
	{
        key: 'about',
		label: 'menu.about',
		leadingIcon: 'information-variant',
		SubActivity: <About/>,
	},
];

export const settingsPages : SettingsItem[] = [
	{
		key: 'maps',
		label: 'settings.maps',
        left: props => <List.Icon {...props} icon="map" />,
		SubActivity: <SettingsMaps/>,
	},
	{
		key: 'general',
		label: 'settings.general',
        left: props => <List.Icon {...props} icon="application-cog-outline" />,
		SubActivity: <SettingsGeneral/>,
	},
	{
		key: 'appearance',
        label: 'settings.appearance',
        left: ( { color, style } ) => <MaterialIcons style={ style } name="style" size={ 25 } color={ color } />,
        SubActivity: <SettingsAppearance/>,
	},
];

export const setSelectedHierarchyItemsByKey = (
    keys: string[], // eg ['menuItems.settings','settingsPages.maps']
    setSelectedHierarchyItems?: Dispatch<SetStateAction<null | HierarchyItem[]>>,
) => {
    if ( setSelectedHierarchyItems ) {
        const newItems = [...keys].map( key => {
            const [type,itemKey] = key.split( '.' );
            return ( 'menuItems' === type ? menuItems : settingsPages ).find( item => item.key === itemKey );
        } ).filter( a => !! a );
        setSelectedHierarchyItems( newItems );
    }
};