/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useEffect,
	useState,
} from 'react';
import {
	NativeModules,
	SafeAreaView,
	StatusBar,
	ToastAndroid,
	useColorScheme,
	useWindowDimensions,
	View,
} from 'react-native';
import 'intl-pluralrules';
import { useTranslation } from 'react-i18next';
import DefaultPreference from 'react-native-default-preference';
import {
	PaperProvider,
	useTheme,
} from 'react-native-paper';
import useDeepCompareEffect from 'use-deep-compare-effect'
import { get, pick, without } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	MapContainer,
	LayerBitmapTile,
	LayerScalebar,
	type Location,
	type HardwareKeyEventResponse,
	type MapContainerProps,
	LayerMBTilesBitmap,
	LayerHillshading,
	LayerMapsforge,
	LayerMapsforgeProps,
	usePromiseQueueState,
	MapContainerModule,
	MapEventResponse,
	ResponseInclude,
	useMapLayersCreated,
	LayerMBTilesBitmapResponse,
	LayerMapsforgeResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';
import TopAppBar from './TopAppBar';
import type {
	OptionBase,
	HierarchyItem,
	ThemeOption,
	AbsPathsMap,
	LayerConfig,
	MapSettings,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
	LayerConfigOptionsHillshading,
	LayerConfigOptionsMapsforge,
	AppearanceSettings,
	GeneralSettings,
	DashboardElementConf,
	LayerInfos,
	UiState,
} from '../types';
import customThemes from '../themes';
import { AppContext } from '../Context';
import Center from './Center';
import { HelperModule } from '../nativeModules';
import { Dashboard } from './Dashboard';
import { defaults } from '../constants';
import * as dashboardElementComponents from "./Dashboard/elements";
import SplashScreen from './SplashScreen';
import MapLayersAttribution from './MapLayersAttribution';

const useAppTheme = () => {

	const { t } = useTranslation();

	const [initialized,setInitialized] = useState( false );
	const systemIsDarkMode = useColorScheme() === 'dark';
	const [selectedTheme,setSelectedTheme] = useState<null | string>( null );

	let themeOptions : ThemeOption[] = Object.keys( customThemes ).map( ( customThemeKey : string ) => (  {
		key: customThemeKey,
		label: t( customThemes[customThemeKey]?.label || '' ),
		value: customThemes[customThemeKey],
	} ) );

	const systemOpt = themeOptions.find( opt => opt.key === ( systemIsDarkMode ? 'dark' : 'light' ) );

	if ( systemOpt ) {
		themeOptions = [
			{
				key: 'system',
				label: t( 'systemSetting' ),
				value: systemOpt.value
			},
			...themeOptions,
		];
	}

	useEffect( () => {
		if ( null === selectedTheme ) {
			DefaultPreference.get( 'theme' ).then( themePref => {
				setSelectedTheme( themePref != null && [...themeOptions].map( opt => opt.key ).includes( themePref )
					? themePref
					: 'system'
				)
			} ).catch( err => 'ERROR' + console.log( err ) );
		}
	}, [] );

	useEffect( () => {
		if ( null !== selectedTheme ) {
			DefaultPreference.set( 'theme', selectedTheme ).catch( err => 'ERROR' + console.log( err ) )
			.then( () => initialized && ToastAndroid.show( sprintf( t( 'settings.saved' ), t( 'theme' ) ), ToastAndroid.SHORT ) )
			.catch( err => 'ERROR' + console.log( err ) );
			setInitialized( true );
		}
	}, [selectedTheme] );

	return {
		selectedTheme,
		setSelectedTheme,
		themeOptions,
	};
};

const useAppLang = () => {

	const {t, i18n} = useTranslation();

	let langOptions = [
		{ key: 'system', label: t( 'systemSetting' ) },
		{ key: 'en', label: 'English' },
		{ key: 'de', label: 'Deutsch' },
	];

	const [initialized,setInitialized] = useState( false );
	const [selectedLang,setSelectedLang] = useState<null | string>( null );

	const changeLang = ( newSelectedLang : ( string | null ) ) : void => {
		newSelectedLang = !! newSelectedLang && [...langOptions].map( opt => opt.key ).includes( newSelectedLang )
			? newSelectedLang
			: 'system';
		let newLang = i18n.language;
		if ( newSelectedLang === 'system' ) {
			const systemLocale = NativeModules.I18nManager.localeIdentifier;
			const systemLangOpt = langOptions.find( opt => systemLocale.startsWith( opt.key ) );
			newLang = !! systemLangOpt ? systemLangOpt.key : newLang;
		} else {
			newLang = newSelectedLang;
		}
		i18n.changeLanguage( newLang )
			.then( () => setSelectedLang( newSelectedLang ) )
			.catch( err => 'ERROR' + console.log( err ) );
	};

	useEffect( () => {
		if ( null === selectedLang ) {
			DefaultPreference.get( 'lang' ).then( ( newSelectedLang?: string | null ) => {
				changeLang( newSelectedLang || null );
			} ).catch( err => 'ERROR' + console.log( err ) );
		}
	}, [] );

	useEffect( () => {
		if ( selectedLang ) {
			DefaultPreference.set( 'lang', selectedLang ).catch( err => 'ERROR' + console.log( err ) )
			.then( () => initialized && ToastAndroid.show( sprintf( t( 'settings.saved' ), t( 'language' ) ), ToastAndroid.SHORT ) )
			.catch( err => 'ERROR' + console.log( err ) );
			setInitialized( true );
		}
	}, [selectedLang]);

	return {
		selectedLang,
		langOptions,
		changeLang,
	};
};

const AppWrapper = () => {

	const {
		selectedTheme,
		setSelectedTheme,
		themeOptions,
	} = useAppTheme();

	const {
		selectedLang,
		langOptions,
		changeLang,
	} = useAppLang();

	const theme = themeOptions.find( opt => opt.key === selectedTheme );

	if ( selectedTheme === null ) {
		return null;
	}

	if ( selectedLang === null ) {
		return null;
	}

	if ( ! theme ) {
		return null;
	}

	return <PaperProvider
		theme={ theme.value }
	>
		<App
			selectedLang={ selectedLang }
			selectedTheme={ selectedTheme }
			setSelectedTheme={ setSelectedTheme }
			themeOptions={ themeOptions }
			langOptions={ langOptions }
			changeLang={ changeLang }
		/>
	</PaperProvider>;
};

const mergeSettingsForKey = ( initialSettings: object, newSettings: object, key: string ) => ( {
	[key]: {
		...get( initialSettings, key, {} ),
		...( newSettings.hasOwnProperty( key ) && pick(
			get( newSettings, key, {} ),
			Object.keys( get( initialSettings, key, {} ) )
		) ),
	},
} );

const useSettings = ( {
	maybeIsBusyAdd,
	maybeIsBusyRemove,
	settingsKey,
	savedMessage,
	initialSettings = {},
} : {
	maybeIsBusyAdd?: ( key: string ) => void;
	maybeIsBusyRemove?: ( key: string ) => void;
	savedMessage?: string;
	settingsKey: string;
	initialSettings?: object;
} ) => {

	const [initialized,setInitialized] = useState( false );
	const [settings,setSettings] = useState<object>( initialSettings );

    useEffect( () => {
		const busyKey = 'useSettings' + 'load' + settingsKey;
		maybeIsBusyAdd && maybeIsBusyAdd( busyKey );
		setTimeout( () => DefaultPreference.get( settingsKey ).then( newSettingsStr => {
			if ( newSettingsStr ) {
				const newSettings = JSON.parse( newSettingsStr );
				setSettings( {
					...initialSettings,
					...newSettings,
					...( 'generalSettings' === settingsKey && {
						...mergeSettingsForKey( initialSettings, newSettings, 'unitPrefs' ),
						...mergeSettingsForKey( initialSettings, newSettings, 'dashboardElements' ),
					} ),
				} );
			}
			setInitialized( true );
		} ).catch( err => 'ERROR' + console.log( err ) )
		.finally( () => maybeIsBusyRemove && maybeIsBusyRemove( busyKey ) ), 1 );
    }, [] );

	useDeepCompareEffect( () => {
		if ( initialized ) {
			const busyKey = 'useSettings' + 'changed' + settingsKey;
			maybeIsBusyAdd && maybeIsBusyAdd( busyKey );
			setTimeout( () => DefaultPreference.set( settingsKey, JSON.stringify( settings ) )
			.then( () => savedMessage ? ToastAndroid.show( savedMessage, ToastAndroid.SHORT ) : null )
			.catch( err => 'ERROR' + console.log( err ) )
			.finally( () => maybeIsBusyRemove && maybeIsBusyRemove( busyKey ) ), 10 );
		}
	}, [settings] )
	return {
		settings,
		setSettings,
		initialized,
	};

};

const useInitialCenter = () => {
	const [initialized,setInitialized] = useState( false );
	const [initialPosition,setInitialPosition] = useState<null | {
		center: Location,
		zoomLevel: number,
	}>( null );
	useEffect( () => {
		DefaultPreference.get( 'initialPosition' ).then( newInitialPosition => {
			if ( newInitialPosition ) {
				setInitialPosition( JSON.parse( newInitialPosition ) );
			} else {
				setInitialPosition( {
					center: {
						lng: -70.239,
						lat: -10.65,
					},
					zoomLevel: 5,
				} );
			}
		} ).catch( err => 'ERROR' + console.log( err ) );
	}, [] );

	useEffect( () => {
		if ( initialPosition ) {
			if ( initialized ) {
				DefaultPreference.set( 'initialPosition', JSON.stringify( initialPosition ) )
				.catch( err => 'ERROR' + console.log( err ) );
			}
			setInitialized( true );
		}
	}, [initialPosition] )
	return {
		initialPosition,
		setInitialPosition,
	};
};

const useIsBusy = () => {
	const [isBusy,setIsBusy] = useState( true );
	const [maybeIsBusy,setMaybeIsBusy] = useState<string[]>( [] );
	const maybeIsBusyAdd = ( key: string ) => setMaybeIsBusy( [...maybeIsBusy, key] );
	const maybeIsBusyRemove = ( key: string ) => setMaybeIsBusy( without( maybeIsBusy, key ) );
	const promiseQueueState = usePromiseQueueState();
	useEffect( () => {
		setIsBusy( promiseQueueState !== 0 || maybeIsBusy.length > 0 );
	}, [maybeIsBusy, promiseQueueState] );
	return {
		isBusy,
		maybeIsBusyAdd,
		maybeIsBusyRemove,
	};
};

const useShowSplash = ( {
	mapViewNativeNodeHandle,
	isBusy,
}: {
	mapViewNativeNodeHandle: null | number;
	isBusy: boolean;
} ) => {
	const mapLayersCreated = useMapLayersCreated( mapViewNativeNodeHandle );
	const [mapLayersCreatedDef,setMapLayersCreatedDef] = useState( false );
	const [showSplash,setShowSplash] = useState( true );
	useEffect( () => {
		if ( mapLayersCreated ) {
			setTimeout( () => {
				setMapLayersCreatedDef( true );
			}, 100 );
		}
	}, [mapLayersCreated] );
	useEffect( () => {
		if ( showSplash && ( mapLayersCreatedDef && ! isBusy ) ) {
			setShowSplash( false );
		}
	}, [
		mapLayersCreatedDef,
		isBusy,
		showSplash
	] );
	return showSplash;
};

const useLayerInfos = () => {
	const [layerInfos,setLayerInfos] = useState<LayerInfos>( {} );
	const onLayerChange = ( key: string, response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse ) => {
		setLayerInfos( layerInfos => ( {
			...layerInfos,
			[key]: pick( response, [
				'attribution',
				'description',
				'comment',
				'createdBy',
			] ),
		} ) );
	};
	return {
		layerInfos,
		onLayerChange,
	};
};

const App = ( {
	selectedTheme,
	setSelectedTheme,
	themeOptions,
	langOptions,
	changeLang,
	selectedLang,
} : {
	selectedTheme: string,
	setSelectedTheme: Dispatch<SetStateAction<string | null>>;
	themeOptions: ThemeOption[],
	langOptions: OptionBase[],
	changeLang: ( newSelectedLang : string ) => void;
	selectedLang: string,
} ) => {

	const { t } = useTranslation();
	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';
	const [topAppBarHeight,setTopAppBarHeight] = useState<number>( 0 );
	const [bottomBarHeight,setBottomBarHeight] = useState<number>( 0 );
	const [selectedHierarchyItems,setSelectedHierarchyItems] = useState<null | HierarchyItem[]>( null );
    const [currentMapEvent,setCurrentMapEvent] = useState<MapEventResponse>( {} );

	const {
		isBusy,
		maybeIsBusyAdd,
		maybeIsBusyRemove,
	} = useIsBusy();

	const {
		width,
		height,
	} = useWindowDimensions();

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>( null );

	const showSplash = useShowSplash( {
		mapViewNativeNodeHandle,
		isBusy,
	} );

	const [appDirs,setAppDirs] = useState<null | AbsPathsMap>( null );

	useEffect( () => {
		HelperModule.getAppDirs().then( ( dirs : AbsPathsMap ) => {
			setAppDirs( dirs );
		} ).catch( ( err: any ) => console.log( 'ERROR', err ) );
	}, [] );

	let {
		settings: uiState,
		setSettings: setUiState,
		initialized: uiStateInitialized,
	} = useSettings( {
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		savedMessage: undefined,
		settingsKey: 'uiState',
		initialSettings: defaults.uiState,
	} ) as {
		settings: UiState;
		setSettings: Dispatch<SetStateAction<UiState>>;
		initialized: boolean;
	};

	let {
		settings: mapSettings,
		setSettings: setMapSettings,
		initialized: mapSettingsInitialized,
	} = useSettings( {
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		savedMessage: sprintf( t( 'settings.saved' ), t( 'settings.maps' ) ),
		settingsKey: 'mapSettings',
		initialSettings: defaults.mapSettings,
	} ) as {
		settings: MapSettings;
		setSettings: Dispatch<SetStateAction<MapSettings>>;
		initialized: boolean;
	};

	let {
		settings: appearanceSettings,
		setSettings: setAppearanceSettings,
		initialized: appearanceSettingsInitialized,
	} = useSettings( {
		savedMessage: sprintf( t( 'settings.saved' ), t( 'settings.appearance' ) ),
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		settingsKey: 'appearanceSettings',
		initialSettings: defaults.appearanceSettings,
	} ) as {
		settings: AppearanceSettings;
		setSettings: Dispatch<SetStateAction<AppearanceSettings>>;
		initialized: boolean;
	};

	let {
		settings: generalSettings,
		setSettings: setGeneralSettings,
		initialized: generalSettingsInitialized,
	} = useSettings( {
		savedMessage: sprintf( t( 'settings.saved' ), t( 'settings.general' ) ),
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		settingsKey: 'generalSettings',
		initialSettings: defaults.generalSettings,
	} ) as {
		settings: GeneralSettings;
		setSettings: Dispatch<SetStateAction<GeneralSettings>>;
		initialized: boolean;
	};
	// Remove bottomBar if no dashboard elements.
	useEffect( () => {
		if ( ! generalSettings?.dashboardElements?.elements || ( generalSettings?.dashboardElements?.elements && ! generalSettings?.dashboardElements?.elements.length ) ) {
			setBottomBarHeight( 0 );
		}
	}, [generalSettings?.dashboardElements?.elements] );

	const {
		initialPosition,
		setInitialPosition,
	} = useInitialCenter();

	const {
		layerInfos,
		onLayerChange,
	} = useLayerInfos();

	const appInnerHeight = height - topAppBarHeight;

	if (
		! appDirs
		|| ! initialPosition
		|| ! mapSettingsInitialized
		|| ! appearanceSettingsInitialized
		|| ! generalSettingsInitialized
		|| ! uiStateInitialized
	) {
		return  <SafeAreaView style={ {
			backgroundColor: theme.colors.background,
			height,
			width,
		} }>
			<SplashScreen/>
		</SafeAreaView>;
	}

	return <AppContext.Provider value={ {
		appDirs,
		selectedTheme,
		setSelectedTheme,
		themeOptions,
		langOptions,
		changeLang,
		selectedLang,
		mapViewNativeNodeHandle,
		appInnerHeight,
		topAppBarHeight,
		bottomBarHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
		mapSettings,
		setMapSettings,
		uiState,
		setUiState,
		appearanceSettings,
		setAppearanceSettings,
		generalSettings,
		setGeneralSettings,
		isBusy,
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		currentMapEvent,
	} }>
		<SafeAreaView style={ {
			backgroundColor: theme.colors.background,
			height,
			width,
		} }>

			{ showSplash && <SplashScreen/> }

			<StatusBar barStyle={ systemIsDarkMode ? 'light-content' : 'dark-content' } />

			<TopAppBar setTopAppBarHeight={ setTopAppBarHeight } />

			<View style={ {
				height: appInnerHeight - bottomBarHeight,
				width,
			} } >

				{ selectedHierarchyItems !== null && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity }

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
					height={ appInnerHeight - bottomBarHeight }
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
									options = layer.options as LayerConfigOptionsOnlineRasterXYZ;
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
									options = layer.options as LayerConfigOptionsRasterMBtiles;
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
										const layerMapsforgeOptions = layer.options as LayerConfigOptionsMapsforge;
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
											onCreate={ response => onLayerChange( layer.key, response ) }
											onChange={ response => onLayerChange( layer.key, response ) }
										/>;
									}
									return null;
								case 'hillshading':
									options = layer.options as LayerConfigOptionsHillshading;
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
					height={ appInnerHeight - bottomBarHeight }
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
				currentMapEvent={ currentMapEvent }
				setBottomBarHeight={ setBottomBarHeight }
			/> }

		</SafeAreaView>
	</AppContext.Provider>;
};

export default AppWrapper;