
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	useWindowDimensions,
	View,
} from 'react-native';
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
import ListItem from './ListItem';

const settingsPages : SettingsItem[] = [
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
	const { width } = useWindowDimensions();
    const {
        mapHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
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