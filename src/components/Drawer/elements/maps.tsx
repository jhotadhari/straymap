/**
 * External dependencies
 */
import React, {
    useContext,
    useState,
} from 'react';
import {
    Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView } from "react-native";

/**
 * Internal dependencies
 */
import { AppContext, SettingsMapsContext } from '../../../Context';
import useProfiles from '../../../compose/useProfiles';
import useLayers from '../../../compose/useLayers';
import MapLayersControl from '../../MapLayersControl';
import MapsforgeProfilesControl from '../../MapsforgeProfilesControl';
import ButtonHighlight from '../../generic/ButtonHighlight';
import { setSelectedHierarchyItemsByKey } from '../../../hierarchyItems';

const DisplayComponent = ( {
	drawerWidth,
	drawerHeight,
	drawerSide,
} : {
	drawerWidth: number;
	drawerHeight: number;
	drawerSide: string;
} ) => {


    const {
        setSelectedHierarchyItems,
    } = useContext( AppContext )

    const { t } = useTranslation();

	const theme = useTheme();

    const {
        editProfile,
        setEditProfile,
        updateProfile,
        profiles,
        setProfiles,
        saveProfiles,
        getNewProfile,
    } = useProfiles( {
        saveOnSet: true,
        saveOnSetDelay: 300,
    } );

    const {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,
    } = useLayers( {
        saveOnSet: true,
        saveOnSetDelay: 300,
    } );

    const [scrollEnabled,setScrollEnabled] = useState( true );

    return <SettingsMapsContext.Provider value={ {
        // layers
        layers,
        editLayer,
        setEditLayer,
        updateLayer,
        setLayers,
        saveLayers,
        // profiles
        profiles,
        editProfile,
        setEditProfile,
        updateProfile,
        setProfiles,
        saveProfiles,
        getNewProfile,
	} }>
        <ScrollView
            scrollEnabled={ scrollEnabled }
            style={ {
                backgroundColor: theme.colors.background,
                height: drawerHeight,
                width: drawerWidth,
                position: 'absolute',
                marginTop: 3,
            } }
        >
            <ButtonHighlight
                style={ { marginHorizontal: 20, marginBottom: 20 } }
                mode='outlined'
                onPress={ () => setSelectedHierarchyItemsByKey(
                    ['menuItems.settings','settingsPages.maps'],
                    setSelectedHierarchyItems
                ) }
            >
                <Text>{ t( 'openMapsSettings' ) }</Text>
            </ButtonHighlight>

            <MapLayersControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                reverseDraggableItem={ 'left' === drawerSide }
                uiStateKey={ 'DrawerMapLayersExpanded' + drawerSide }
                newLabel={ t( 'addNew' ) }
            />

            <MapsforgeProfilesControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                reverseDraggableItem={ 'left' === drawerSide }
                uiStateKey={ 'DrawerMapsforgeProfilesExpanded' + drawerSide }
                newLabel={ t( 'addNew' ) }
            />

        </ScrollView>
    </SettingsMapsContext.Provider>;;
};


export default {
    key: 'maps',
    label: 'maps',
    DisplayComponent,
    iconSource: 'map',
};
