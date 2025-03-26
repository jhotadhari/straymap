/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useContext,
} from 'react';
import {
	StatusBar,
	useColorScheme,
	useWindowDimensions,
	View,
} from 'react-native';
import 'intl-pluralrules';
import {
	useTheme,
} from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	MapContainer,
	LayerBitmapTile,
	LayerScalebar,
	type HardwareKeyEventResponse,
	type MapContainerProps,
	LayerMBTilesBitmap,
	LayerHillshading,
	LayerMapsforge,
	LayerMapsforgeProps,
	MapContainerModule,
	MapEventResponse,
	ResponseInclude,
	LayerMBTilesBitmapResponse,
	LayerMapsforgeResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';
import TopAppBar from './TopAppBar';
import type {
	LayerConfig,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
	DashboardElementConf,
	LayerInfos,
    InitialPosition,
} from '../types';
import { AppContext } from '../Context';
import Center from './Center';
import { Dashboard } from './Dashboard';
import * as dashboardElementComponents from "./Dashboard/elements";
import SplashScreen from './SplashScreen';
import MapLayersAttribution from './MapLayersAttribution';

const AppView = ( {
    showSplash,
    initialPosition,
    setInitialPosition,
    setTopAppBarHeight,
    setBottomBarHeight,
    setCurrentMapEvent,
    setMapViewNativeNodeHandle,
    layerInfos,
    onLayerChange,
} : {
    showSplash: boolean;
    initialPosition: InitialPosition;
    setInitialPosition: Dispatch<SetStateAction<null | InitialPosition>>;
    setTopAppBarHeight: Dispatch<SetStateAction<number>>;
    setBottomBarHeight: Dispatch<SetStateAction<number>>;
    setCurrentMapEvent: Dispatch<SetStateAction<MapEventResponse>>;
    setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
    layerInfos: LayerInfos;
    onLayerChange: ( key: string, response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse ) => void;
} ) => {

    const theme = useTheme();
    const systemIsDarkMode = useColorScheme() === 'dark';

    const { width, height } = useWindowDimensions();

    const {
		mapViewNativeNodeHandle,
		appInnerHeight,
		bottomBarHeight,
		selectedHierarchyItems,
		mapSettings,
		generalSettings,
		currentMapEvent,
    } = useContext( AppContext );

    if (
        ! generalSettings
        || ! mapSettings

    ) {
        return null;
    }

    const mapHeight = ( appInnerHeight || height ) - ( bottomBarHeight || 0 );

    return <View style={ {
        backgroundColor: theme.colors.background,
        height,
        width,
    } }>

        { showSplash && <SplashScreen/> }

        <StatusBar barStyle={ systemIsDarkMode ? 'light-content' : 'dark-content' } />

        <TopAppBar setTopAppBarHeight={ setTopAppBarHeight } />

        <View style={ {
            height: mapHeight,
            width,
        } } >

            { selectedHierarchyItems && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity }

            <MapContainer
                mapEventRate={ generalSettings.mapEventRate }
                nativeNodeHandle={ mapViewNativeNodeHandle }
                setNativeNodeHandle={ setMapViewNativeNodeHandle }
                hgtReadFileRate={ mapSettings.hgtReadFileRate }
                hgtDirPath={ mapSettings?.hgtDirPath && [...generalSettings.dashboardElements.elements].reduce( ( acc: boolean, ele: DashboardElementConf ) => {
                    return acc || ! ele.type ? acc : get( dashboardElementComponents, [ele.type,'shouldSetHgtDirPath'], false );
                }, false ) as boolean ? mapSettings.hgtDirPath : undefined }
                responseInclude={ [...generalSettings.dashboardElements.elements].reduce( ( acc: object, ele: DashboardElementConf ) => {
                    return ele.type ? {
                        ...acc,
                        ...get( dashboardElementComponents, [ele.type,'responseInclude'], {} ),
                    } : acc;
                }, { zoomLevel: 2 } ) as ResponseInclude }
                height={ mapHeight }
                width={ width }
                center={ initialPosition.center }
                zoomLevel={ initialPosition.zoomLevel }
                zoomMin={ 2 }
                zoomMax={ 20 }
                moveEnabled={ true }
                tiltEnabled={ false }
                rotationEnabled={ false }
                zoomEnabled={ true }
                onPause={ response => {
                    if ( response.center && response.zoomLevel ) {
                        setInitialPosition( {
                            center: response.center,
                            zoomLevel: response.zoomLevel,
                        } );
                    }
                } }
                onError={ err => console.log( 'Error', err ) }
                onResume={ response => console.log( 'lifecycle event onResume', response ) }
                onMapEvent={ ( response: MapEventResponse ) => {
                    // console.log( 'onMapEvent event', response ); // debug
                    setCurrentMapEvent( response );
                } }
                emitsHardwareKeyUp={ [...generalSettings.hardwareKeys].filter( keyConf => 'none' !== keyConf.actionKey ).map( keyConf => keyConf.keyCodeString ) as MapContainerProps['emitsHardwareKeyUp'] }
                onHardwareKeyUp={ generalSettings.hardwareKeys.length > 0 ? ( response: HardwareKeyEventResponse ) => {
                    [...generalSettings.hardwareKeys].map( keyConf => {
                        if ( response.keyCodeString === keyConf.keyCodeString ) {
                            switch( keyConf.actionKey ) {
                                case 'zoomIn':
                                    MapContainerModule.zoomIn( mapViewNativeNodeHandle );
                                    break;
                                case 'zoomOut':
                                    MapContainerModule.zoomOut( mapViewNativeNodeHandle );
                                    break;
                            }
                        }
                    } )
                } : null }
            >

                { [...mapSettings.layers].reverse().map( ( layer : LayerConfig ) => {
                    if ( layer.type && layer.visible ) {
                        let options;
                        switch( layer.type ) {
                            case 'online-raster-xyz':
                                options = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsOnlineRasterXYZ
                                return <LayerBitmapTile
                                    key={ layer.key }
                                    zoomMin={ options.zoomMin }
                                    zoomMax={ options.zoomMax }
                                    enabledZoomMin={ options.enabledZoomMin }
                                    enabledZoomMax={ options.enabledZoomMax }
                                    url={ get( layer.options, 'url', '' ) }
                                    cacheSize={ options.cacheSize }
                                />;
                            case 'raster-MBtiles':
                                options = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsRasterMBtiles
                                return <LayerMBTilesBitmap
                                    key={ layer.key }
                                    mapFile={ options.mapFile }
                                    enabledZoomMin={ options.enabledZoomMin }
                                    enabledZoomMax={ options.enabledZoomMax }
                                    onCreate={ response => onLayerChange( layer.key, response ) }
                                    onChange={ response => onLayerChange( layer.key, response ) }
                                />;
                            case 'mapsforge':
                                if ( mapSettings.mapsforgeProfiles.length > 0 ) {
                                    const layerMapsforgeOptions = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsMapsforge
                                    let profile = mapSettings.mapsforgeProfiles.find( prof => prof.key === layerMapsforgeOptions.profile );
                                    profile = profile || mapSettings.mapsforgeProfiles[0];
                                    return <LayerMapsforge
                                        key={ layer.key }
                                        enabledZoomMin={ layerMapsforgeOptions.enabledZoomMin }
                                        enabledZoomMax={ layerMapsforgeOptions.enabledZoomMax }
                                        mapFile={ layerMapsforgeOptions.mapFile }
                                        renderTheme={ profile.theme as LayerMapsforgeProps['renderTheme'] }
                                        renderStyle={ profile.renderStyle || undefined }
                                        renderOverlays={ profile.renderOverlays }
                                        hasBuildings={ profile.hasBuildings }
                                        hasLabels={ profile.hasLabels }
                                        onCreate={ response => onLayerChange( layer.key, response ) }
                                        onChange={ response => onLayerChange( layer.key, response ) }
                                    />;
                                }
                                return null;
                            case 'hillshading':
                                options = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsHillshading
                                return <LayerHillshading
                                    key={ layer.key }
                                    hgtDirPath={ options.hgtDirPath }
                                    zoomMin={ options.zoomMin }
                                    zoomMax={ options.zoomMax }
                                    enabledZoomMin={ options.enabledZoomMin }
                                    enabledZoomMax={ options.enabledZoomMax }
                                    magnitude={ options.magnitude }
                                    cacheSize={ options.cacheSize }
                                    shadingAlgorithm={ options.shadingAlgorithm }
                                    shadingAlgorithmOptions={ options.shadingAlgorithmOptions }
                                />;
                        }
                    }
                    return null
                } ) }

                <LayerScalebar/>

            </MapContainer>

            <Center
                height={ mapHeight }
                width={ width }
            />

            <MapLayersAttribution
                layerInfos={ layerInfos }
            />

        </View>

        { generalSettings?.dashboardElements?.elements && generalSettings?.dashboardElements?.elements.length > 0 && generalSettings.unitPrefs && <Dashboard
            elements={ generalSettings.dashboardElements.elements }
            dashboardStyle={ generalSettings.dashboardElements.style }
            unitPrefs={ generalSettings.unitPrefs }
            currentMapEvent={ currentMapEvent || {} }
            setBottomBarHeight={ setBottomBarHeight }
        /> }

    </View>;
};

export default AppView;