/**
 * External dependencies
 */
import React, {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useCallback,
	useContext,
    useMemo,
    useState,
} from 'react';
import {
	StatusBar,
	useColorScheme,
	View,
} from 'react-native';
import 'intl-pluralrules';
import {
    useTheme,
} from 'react-native-paper';
import { get, pick } from 'lodash-es';
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context';
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
    LayerBitmapTileProps,
    LayerHillshadingProps,
    MapLifeCycleResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import TopAppBar from './TopAppBar';
import type {
	LayerInfos,
    InitialPosition,
    BottomBarHeight,
} from '../types';
import type {
	LayerConfig,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
} from '../store/features/baseMap/types';
import { AppContext, MapContext } from '../Context';
import Center from './Center';
import { Dashboard } from './Dashboard';
import { Drawers } from './Drawer';
import * as dashboardElementComponents from "./Dashboard/elements";
import SplashScreen from './SplashScreen';
import MapLayersAttribution from './MapLayersAttribution';
import { fillLayerConfigOptionsWithDefaults, getHillshadingCacheDirChild, stringifyProp } from '../utils';
import AltitudeProfile from './AltitudeProfile';
import RoutingMapView from './RoutingMapView';
import { useAppSelector } from '../store/hooks';
import { selectHardwareKeys, selectMapEventRate, selectUnitPrefs } from '../store/features/general/selectors';
import { selectDashboardStyle, selectElements } from '../store/features/dashboard/selectors';
import { DashboardElementConf } from '../store/features/dashboard/types';
import { selectHgtDirPath, selectHgtFileInfoPurgeThreshold, selectHgtInterpolation, selectHgtReadFileRate, selectLayers, selectMapsforgeProfiles } from '../store/features/baseMap/selectors';

const useLayerInfos = () => {
    const [layerInfos,setLayerInfos] = useState<LayerInfos>( {} );
    const onLayerChange = useCallback( (
        key: string,
        response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse // ??? should handle other layer types as well.
    ) => {
        setLayerInfos( layerInfos => ( {
            ...layerInfos,
            [key]: pick( response, [
                'attribution',
                'description',
                'comment',
                'createdBy',
            ] ),
        } ) );
    }, [] );
    return {
        layerInfos,
        onLayerChange,
    };
};

const AppView = ( {
    showSplash,
    initialPositionRef,
    saveCurrentPositionToInitial,
    setTopAppBarHeight,
    setBottomBarHeight,
    setMapViewNativeNodeHandle,
} : {
    showSplash: boolean;
    initialPositionRef: MutableRefObject<InitialPosition | undefined>;
    saveCurrentPositionToInitial: ( response?: MapLifeCycleResponse | MapEventResponse ) => void;
    setTopAppBarHeight: Dispatch<SetStateAction<number>>;
    setBottomBarHeight: Dispatch<SetStateAction<BottomBarHeight>>;
    setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
} ) => {

    const theme = useTheme();
    const systemIsDarkMode = useColorScheme() === 'dark';

    const hardwareKeys = useAppSelector( selectHardwareKeys );

    const dashboardElements = useAppSelector( selectElements );
    const unitPrefs = useAppSelector( selectUnitPrefs );
    const dashboardStyle = useAppSelector( selectDashboardStyle );
    const mapEventRate = useAppSelector( selectMapEventRate );
    const hgtInterpolation = useAppSelector( selectHgtInterpolation );
    const hgtFileInfoPurgeThreshold = useAppSelector( selectHgtFileInfoPurgeThreshold );
    const hgtDirPath = useAppSelector( selectHgtDirPath );
    const hgtReadFileRate = useAppSelector( selectHgtReadFileRate );
    const layers = useAppSelector( selectLayers );
    const mapsforgeProfiles = useAppSelector( selectMapsforgeProfiles );

    const layersReverse = useMemo( () => [...layers].reverse(), [layers] );

    const { width, height } = useSafeAreaFrame();

    const {
        layerInfos,
        onLayerChange,
    } = useLayerInfos();

    const {
		mapViewNativeNodeHandle,
		selectedHierarchyItems,
		appDirs,
		mapHeight,
    } = useContext( AppContext );

    const {
		currentMapEventRef,
    } = useContext( MapContext );

    return <SafeAreaView style={ {
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
                mapEventRate={ mapEventRate }
                nativeNodeHandle={ mapViewNativeNodeHandle }
                setNativeNodeHandle={ setMapViewNativeNodeHandle }
                hgtInterpolation={ hgtInterpolation }
                hgtFileInfoPurgeThreshold={ hgtFileInfoPurgeThreshold }
                hgtReadFileRate={ hgtReadFileRate }
                hgtDirPath={ hgtDirPath && dashboardElements.reduce( ( acc: boolean, ele: DashboardElementConf ) => {
                    return acc || ! ele.type ? acc : get( dashboardElementComponents, [ele.type,'shouldSetHgtDirPath'], false );
                }, false ) as boolean ? hgtDirPath : undefined }
                responseInclude={ dashboardElements.reduce( ( acc: object, ele: DashboardElementConf ) => {
                    return ele.type ? {
                        ...acc,
                        ...get( dashboardElementComponents, [ele.type,'responseInclude'], {} ),
                    } : acc;
                }, { zoomLevel: 2 } ) as ResponseInclude }
                height={ mapHeight || 0 }
                width={ width }
                center={ initialPositionRef?.current?.center }
                zoomLevel={ initialPositionRef?.current?.zoomLevel }
                zoomMin={ 2 }
                zoomMax={ 20 }
                moveEnabled={ true }
                tiltEnabled={ false }
                rotationEnabled={ false }
                zoomEnabled={ true }
                onPause={ saveCurrentPositionToInitial }
                onError={ err => console.log( 'Error', err ) }
                onResume={ response => console.log( 'lifecycle event onResume', response ) }
                onMapEvent={ ( response: MapEventResponse ) => {
                    currentMapEventRef.current = response;
                } }
                emitsHardwareKeyUp={ hardwareKeys.filter( keyConf => 'none' !== keyConf.actionKey ).map( keyConf => keyConf.keyCodeString ) as MapContainerProps['emitsHardwareKeyUp'] }
                onHardwareKeyUp={ hardwareKeys.length > 0 ? ( response: HardwareKeyEventResponse ) => {
                    hardwareKeys.forEach( keyConf => {
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

                { layersReverse.map( ( layer : LayerConfig ) => {
                    if ( layer.type && layer.visible ) {
                        let options;
                        let cacheDirBase;
                        switch( layer.type ) {
                            case 'online-raster-xyz':
                                options = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsOnlineRasterXYZ
                                cacheDirBase = 'internal' === options?.cacheDirBase
                                    ? get( appDirs, 'internalCacheDir', undefined )
                                    : options?.cacheDirBase as LayerConfigOptionsOnlineRasterXYZ['cacheDirBase'];
                                return <LayerBitmapTile
                                    key={ layer.key }
                                    zoomMin={ options.zoomMin }
                                    zoomMax={ options.zoomMax }
                                    enabledZoomMin={ options.enabledZoomMin }
                                    enabledZoomMax={ options.enabledZoomMax }
                                    url={ get( layer.options, 'url', '' ) }
                                    alpha={ options.alpha }
                                    cacheSize={ options.cacheSize }
                                    cacheDirChild={ stringifyProp( options.url || '' ) }
                                    cacheDirBase={ ( cacheDirBase || '/' ) as LayerBitmapTileProps['cacheDirBase'] }    // if `/`, will fallback to java getReactApplicationContext().getCacheDir();
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
                                if ( mapsforgeProfiles.length > 0 ) {
                                    const layerMapsforgeOptions = fillLayerConfigOptionsWithDefaults( layer.type, layer.options ) as LayerConfigOptionsMapsforge
                                    let profile = mapsforgeProfiles.find( prof => prof.key === layerMapsforgeOptions.profile );
                                    profile = profile || mapsforgeProfiles[0];
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
                                cacheDirBase = 'internal' === options?.cacheDirBase
                                    ? get( appDirs, 'internalCacheDir', undefined )
                                    : options?.cacheDirBase as LayerConfigOptionsHillshading['cacheDirBase']
                                return <LayerHillshading
                                    key={ layer.key }
                                    hgtDirPath={ options.hgtDirPath }
                                    zoomMin={ options.zoomMin }
                                    zoomMax={ options.zoomMax }
                                    enabledZoomMin={ options.enabledZoomMin }
                                    enabledZoomMax={ options.enabledZoomMax }
                                    magnitude={ options.magnitude }
                                    cacheSize={ options.cacheSize }
                                    cacheDirChild={ getHillshadingCacheDirChild( options ) }
                                    cacheDirBase={ ( cacheDirBase || '/' ) as LayerHillshadingProps['cacheDirBase'] }    // if ``, will fallback to cache dbname;
                                    shadingAlgorithm={ options.shadingAlgorithm }
                                    shadingAlgorithmOptions={ options.shadingAlgorithmOptions }
                                />;
                        }
                    }
                    return null
                } ) }

                <LayerScalebar/>

                { /* has to be last. bug until MapContainer.View is mixing up reactTreeIndex */ }
                <RoutingMapView/>

            </MapContainer>

            <Center
                height={ mapHeight || 0 }
                width={ width }
            />

            <Drawers
                height={ mapHeight || 0 }
                outerWidth={ width }
            />

            <MapLayersAttribution
                layerInfos={ layerInfos }
            />

        </View>

        <AltitudeProfile
            outerWidth={ width }
            setBottomBarHeight={ setBottomBarHeight }
        />

        { dashboardElements.length > 0 && <Dashboard
            elements={ dashboardElements }
            dashboardStyle={ dashboardStyle }
            unitPrefs={ unitPrefs }
            setBottomBarHeight={ setBottomBarHeight }
            outerWidth={ width }
        /> }

    </SafeAreaView>;
};

export default AppView;