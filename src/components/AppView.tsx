/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useContext,
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
import { get } from 'lodash-es';
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
    LayerMarker,
    Marker,
    LayerPathSlopeGradient,
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
    BottomBarHeight,
    RoutingSegment,
} from '../types';
import { AppContext, RoutingContext } from '../Context';
import Center from './Center';
import { Dashboard } from './Dashboard';
import { Drawers } from './Drawer';
import * as dashboardElementComponents from "./Dashboard/elements";
import SplashScreen from './SplashScreen';
import MapLayersAttribution from './MapLayersAttribution';
import { fillLayerConfigOptionsWithDefaults, getHillshadingCacheDirChild, stringifyProp } from '../utils';
import AltitudeProfile from './AltitudeProfile';

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
    setBottomBarHeight: Dispatch<SetStateAction<BottomBarHeight>>;
    setCurrentMapEvent: Dispatch<SetStateAction<MapEventResponse>>;
    setMapViewNativeNodeHandle: Dispatch<SetStateAction<null | number>>;
    layerInfos: LayerInfos;
    onLayerChange: ( key: string, response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse ) => void;
} ) => {

    const theme = useTheme();
    const systemIsDarkMode = useColorScheme() === 'dark';

    const { width, height } = useSafeAreaFrame();

    const {
		mapViewNativeNodeHandle,
		appInnerHeight,
		bottomBarHeight,
		selectedHierarchyItems,
		appDirs,
		mapSettings,
		generalSettings,
		currentMapEvent,
		mapHeight,
    } = useContext( AppContext );

    const {
		points,
		segments,
		setSegments,
        markerLayerUuid,
        setMarkerLayerUuid,
        pathLayerUuids,
        setPathLayerUuids,
		triggeredMarkerIdx,
		setTriggeredMarkerIdx,
		triggeredSegment,
		setTriggeredSegment,
    } = useContext( RoutingContext );

    if (
        ! generalSettings
        || ! mapSettings

    ) {
        return null;
    }

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
                mapEventRate={ generalSettings.mapEventRate }
                nativeNodeHandle={ mapViewNativeNodeHandle }
                setNativeNodeHandle={ setMapViewNativeNodeHandle }
                hgtInterpolation={ mapSettings.hgtInterpolation }
                hgtFileInfoPurgeThreshold={ mapSettings.hgtFileInfoPurgeThreshold }
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
                height={ mapHeight || 0 }
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

                { segments && segments.length > 0 && [...segments].map( ( segment, index ) => {
                    if (
                        ! segment.positions
                        || ! segment.positions.length
                        || ! points
                    ) {
                        return null;
                    }
                    const fromPointIdx = points.findIndex( point => segment.fromId === point.id );
                    const toPointIdx = points.findIndex( point => segment.toId === point.id );
                    if (
                        -1 === fromPointIdx
                        || -1 === toPointIdx
                        || toPointIdx !== fromPointIdx + 1
                    ) {
                        return null;
                    }

                    return <LayerPathSlopeGradient
                        key={ segment.fromId + segment.toId }
                        responseInclude={ {
	                        // coordinates: 1,
	                        coordinatesSimplified: 1,
                        } }
                        onCreate={ response => {
                            if ( response?.uuid && setPathLayerUuids ) {
                                setPathLayerUuids( [...( pathLayerUuids || [] ), response.uuid] );
                            }
                            if ( response?.coordinatesSimplified && setSegments ) {
                                const newSegments = [...segments];
                                const newSegment: RoutingSegment = {
                                    ...segment,
                                    coordinatesSimplified: response.coordinatesSimplified,
                                };
                                newSegments.splice( index, 1, newSegment );
                                setSegments( newSegments );
                            }
                        } }
                        onRemove={ response => {
                            const idx = pathLayerUuids?.findIndex( routingPathLayerUuid => routingPathLayerUuid === response.uuid );
                            if ( idx && idx > -1 && pathLayerUuids && setPathLayerUuids ) {
                                const newRoutingPathLayerUuids = [...pathLayerUuids];
                                newRoutingPathLayerUuids.splice( idx, 1 );
                                setPathLayerUuids( newRoutingPathLayerUuids );
                            }
                        } }
                        positions={ segment.positions }
                        style={ {
                            strokeWidth: 5,
                        } }
                        onTrigger={ response => {
                            setTriggeredSegment && setTriggeredSegment( {
                                index,
                                nearestPoint: response.nearestPoint
                            } );
                        } }
                    />;
                } ) }

                { points && points.length > 0 && <LayerMarker
                    onCreate={ response => response.uuid && setMarkerLayerUuid ? setMarkerLayerUuid( response.uuid ) : null }
                    onRemove={ () => setMarkerLayerUuid && setMarkerLayerUuid( null ) }
                >
                    { [...points].map( ( point, index ) => <Marker
                        key={ point.id }
                        position={ point.location }
                        symbol={ {
                            text: index + '',
                        } }
                        onTrigger={ response => {
                            setTriggeredMarkerIdx && setTriggeredMarkerIdx( index );
                        } }
                    /> ) }
                </LayerMarker> }

                <LayerScalebar/>

            </MapContainer>

            <Center
                height={ mapHeight || 0 }
                width={ width }
            />

            <Drawers
                height={ mapHeight || 0 }
                outerWidth={ width }
                currentMapEvent={ currentMapEvent || {} }
            />

            <MapLayersAttribution
                layerInfos={ layerInfos }
            />

        </View>

        <AltitudeProfile
            outerWidth={ width }
            setBottomBarHeight={ setBottomBarHeight }
        />

        { generalSettings?.dashboardElements?.elements && generalSettings?.dashboardElements?.elements.length > 0 && generalSettings.unitPrefs && <Dashboard
            elements={ generalSettings.dashboardElements.elements }
            dashboardStyle={ generalSettings.dashboardElements.style }
            unitPrefs={ generalSettings.unitPrefs }
            currentMapEvent={ currentMapEvent || {} }
            setBottomBarHeight={ setBottomBarHeight }
            outerWidth={ width }
        /> }

    </SafeAreaView>;
};

export default AppView;