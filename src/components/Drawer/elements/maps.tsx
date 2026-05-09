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
import LayersControl from '../../../store/features/baseMap/components/controls/LayersControl';
import ProfilesControl from '../../../store/features/baseMap/components/controls/ProfilesControl';
import ButtonHighlight from '../../generic/ButtonHighlight';
import { setSelectedHierarchyItemsByKey } from '../../../hierarchyItems';
import { AppContext } from '../../../Context';
import useProfiles from '../../../store/features/baseMap/hooks/useProfiles';
import { ContextSettingsMaps } from '../../../store/features/baseMap/ContextSettingsMaps';

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
    } = useProfiles( {
        saveOnSet: true,
        saveOnSetDelay: 300,
    } );

    const [scrollEnabled,setScrollEnabled] = useState( true );

    return <ContextSettingsMaps.Provider value={ {
        // profiles
        profiles,
        editProfile,
        setEditProfile,
        updateProfile,
        setProfiles,
        saveProfiles,
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

            <LayersControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                reverseDraggableItem={ 'left' === drawerSide }
                uiStateKey={ 'DrawerMapLayersExpanded' + drawerSide }
                newLabel={ t( 'addNew' ) }
                saveOnChange={ true }
                saveOnUnmount={ false }
            />

            {/* <ProfilesControl
                setScrollEnabled={ setScrollEnabled }
                width={ drawerWidth }
                reverseDraggableItem={ 'left' === drawerSide }
                uiStateKey={ 'DrawerMapsforgeProfilesExpanded' + drawerSide }
                newLabel={ t( 'addNew' ) }
            /> */}

        </ScrollView>
    </ContextSettingsMaps.Provider>;;
};


export default {
    key: 'maps',
    label: 'maps',
    DisplayComponent,
    iconSource: 'map',
};
