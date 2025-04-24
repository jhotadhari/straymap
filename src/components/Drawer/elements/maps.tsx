/**
 * External dependencies
 */
import React, {
    useState,
} from 'react';
import {
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView } from "react-native";

/**
 * Internal dependencies
 */
import { SettingsMapsContext } from '../../../Context';
import useProfiles from '../../../compose/useProfiles';
import useLayers from '../../../compose/useLayers';
import MapLayersControl from '../../MapLayersControl';
import MapsforgeProfilesControl from '../../MapsforgeProfilesControl';

const DisplayComponent = ( {
	drawerWidth,
	drawerHeight,
} : {

	drawerWidth: number;
	drawerHeight: number;
} ) => {

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
            } }
        >

            <MapLayersControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                reverseDraggableItem={ true }
                uiStateKey='DrawerMapLayersExpanded'
                newLabel={ t( 'addNew' ) }
            />

            <MapsforgeProfilesControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                paddingLeftDraggableItem={ 19 }
                reverseDraggableItem={ true }
                uiStateKey='DrawerMapLayersExpanded'
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
