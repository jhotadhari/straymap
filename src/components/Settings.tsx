
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
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import ListItem from './generic/ListItem';
import { settingsPages } from '../hierarchyItems';

const Settings : FC = () => {

	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useSafeAreaFrame();
    const {
        appInnerHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
    } = useContext( AppContext );

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