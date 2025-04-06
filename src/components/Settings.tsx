
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	View,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import {
    List,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { SettingsItem } from '../types';
import SettingsGeneral from './SettingsGeneral';
import SettingsAppearance from './SettingsAppearance';
import SettingsMaps from './SettingsMaps';
import ListItem from './generic/ListItem';

const settingsPages : SettingsItem[] = [
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

const Settings : FC = () => {

	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useSafeAreaFrame();
    const {
        appInnerHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
        { [...settingsPages].map( ( item, index ) => <ListItem
			key={ index }
			title={ t( item.label ) }
			icon={ item.left ? item.left : undefined }
			onPress={ () => setSelectedHierarchyItems ? setSelectedHierarchyItems( [
				...( selectedHierarchyItems ? selectedHierarchyItems : [] ),
				item,
			] ) : null }
		/> ) }
	</View>;
};

export default Settings;