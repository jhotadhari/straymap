/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	I18nManager,
	ToastAndroid,
	useColorScheme,
	View,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
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
import semverCompare from 'semver-compare';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	usePromiseQueueState,
	CanvasAdapterModule,
	MapEventResponse,
	useMapLayersCreated,
	LayerMBTilesBitmapResponse,
	LayerMapsforgeResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import packageJson from '../../package.json';
import '../assets/i18n/i18n';
import type {
	OptionBase,
	HierarchyItem,
	ThemeOption,
	AbsPathsMap,
	MapSettings,
	AppearanceSettings,
	GeneralSettings,
	LayerInfos,
	UiState,
	InitialPosition,
	UpdaterSettings,
	UpdateResults,
} from '../types';
import customThemes from '../themes';
import { AppContext } from '../Context';
import { HelperModule } from '../nativeModules';
import { defaults } from '../constants';
import SplashScreen from './SplashScreen';
import AppView from './AppView';
import SplashScreenUpdater from './SplashScreenUpdater';

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
			const systemLocale = I18nManager.getConstants().localeIdentifier || 'en';
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

const useInitialCenter = ( currentMapEvent: MapEventResponse ) => {
	const [initialized,setInitialized] = useState( false );
	const [initialPosition,setInitialPosition] = useState<null | InitialPosition>( null );
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
	}, [initialPosition] );

	// Save position every x seconds.
	const [intervalId,setIntervalId] = useState<null | NodeJS.Timeout>( null );
	// Store intervalId in ref
	const intervalIdRef = useRef<null | NodeJS.Timeout>( intervalId );
	useEffect( () => {
		intervalIdRef.current = intervalId;
	}, [intervalId] );
	// Store currentMapEvent in ref
	const currentMapEventRef = useRef<MapEventResponse>( currentMapEvent );
	useEffect( () => {
		currentMapEventRef.current = currentMapEvent;
	}, [currentMapEvent] );
	useEffect( () => {
		if ( initialized && currentMapEventRef?.current && null === intervalIdRef.current ) {
			const newIntervalId = setInterval( () => {
				if ( currentMapEventRef?.current?.center && currentMapEventRef?.current?.zoomLevel ) {
					DefaultPreference.set( 'initialPosition', JSON.stringify( {
						center: currentMapEventRef.current.center,
						zoomLevel: currentMapEventRef.current.zoomLevel,
					} ) )
					.catch( err => 'ERROR' + console.log( err ) );
				}
			}, 1000 * 30 );
			setIntervalId( newIntervalId );
		}
		return () => {
			if ( intervalIdRef.current ) {
				clearInterval( intervalIdRef.current );
			}
		};
	}, [initialized] );

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

const updateCbs: {
	[value: string]: 												// the version updating from
	null | ( ( results: UpdateResults ) => Promise<UpdateResults> )	// function to run when updating from this version.
} = {
	['0.0.2']: null,
	// ['x.x.x']: ( results: UpdateResults ) => new Promise( resolve => {
	// 	const version = 'x.x.x';
	// 	const success = true;
	// 	if ( success ) {
	// 		resolve( {
	// 			...results,
	// 			[version]: {
	// 				state: 'success',
	// 			},
	// 		} );
	// 	} else {
	// 		resolve( {
	// 			...results,
	// 			[version]: {
	// 				state: 'failed',
	// 				msg: 'Some Error wtf'
	// 			},
	// 		} );
	// 	}
	// } ),
};

const useUpdater = ( {
	ready,
	maybeIsBusyAdd,
	maybeIsBusyRemove,
} : {
	ready: boolean;
	maybeIsBusyAdd: ( key: string ) => void;
	maybeIsBusyRemove: ( key: string ) => void;
} ) => {

	let {
		settings: updaterSettings,
		setSettings: setUpdaterSettings,
		initialized: updaterSettingsInitialized,
	} = useSettings( {
		maybeIsBusyAdd,
		maybeIsBusyRemove,
		settingsKey: 'updaterSettings',
		initialSettings: defaults.updaterSettings,
	} ) as {
		settings: UpdaterSettings;
		setSettings: Dispatch<SetStateAction<UpdaterSettings>>;
		initialized: boolean;
	};

	const [isUpdating,setIsUpdating] = useState<boolean | UpdateResults>( true );

	const runUpdates = ( updateCbsKeys: string[] ): Promise<UpdateResults> => new Promise( ( resolve, reject ) => {
		updateCbsKeys.sort( semverCompare );
		const results: UpdateResults = {};
		resolve( [...updateCbsKeys].reduce( ( accumulatorPromise: Promise<UpdateResults>, updateCbsKey: string ) => {
			const cb = ( results: UpdateResults ): Promise<UpdateResults> => new Promise( resolveCb => {
				const updateCb = get( updateCbs, updateCbsKey );
				setIsUpdating( {
					...results,
					[updateCbsKey]: { state: 'updating' },
				} );
				const updateInstalledVersion = () => setUpdaterSettings( updaterSettings => ( {
					...updaterSettings,
					installedVersion: updateCbsKey
				} ) );
				if ( updateCb ) {
					updateCb( results ).then( results => {
						switch( get( results, [updateCbsKey,'state'] ) ) {
							case 'success':
								updateInstalledVersion();
								resolveCb( results );
								break;
							case 'failed':
								setIsUpdating( results );
								reject( results );
								break;
						}
					} )
				} else {
					updateInstalledVersion();
					resolveCb( {
						...results,
						[updateCbsKey]: { state: 'success' },
					} );
				}
			} );
			return accumulatorPromise.then( results => cb( results ) );
		}, Promise.resolve( results ) ) );
	} );

	useEffect( () => {
		if ( ready && updaterSettingsInitialized ) {
			// current version (packageJson.version) is greater than installedVersion.
			if ( 1 === semverCompare( packageJson.version, updaterSettings.installedVersion ) ) {
				// updateCbs keys to run updates for. All that ones lower than packageJson.version and same or higher than installedVersion.
				const updateCbsKeys = Object.keys( updateCbs ).filter( cbVersion => {
					return 1 === semverCompare( packageJson.version, cbVersion )
						&& 1 > semverCompare( updaterSettings.installedVersion, cbVersion );
				} );
				// Run updates, then check if all updates are success.
				runUpdates( updateCbsKeys ).then( ( results: UpdateResults ) => {
					if ( Object.values( results ).every( result => 'success' === result.state ) ) {
						setIsUpdating( false );
						setUpdaterSettings( updaterSettings => ( {
							...updaterSettings,
							installedVersion: packageJson.version
						} ) );
					}
				} ).catch( () => null );	// catch the error, do nothing, no need to handle it.
			} else {
				setIsUpdating( false );
			}
		}
	}, [
		ready,
		updaterSettingsInitialized,
	] );

	return {
		isUpdating,
		setIsUpdating,
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
	const [ready,setReady] = useState<boolean>( false );
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
	} = useSafeAreaFrame();

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>( null );

	const showSplash = useShowSplash( {
		mapViewNativeNodeHandle,
		isBusy,
	} );

	const [appDirs,setAppDirs] = useState<undefined | AbsPathsMap>( undefined );

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
		savedMessage: ready ? sprintf( t( 'settings.saved' ), t( 'settings.maps' ) ) : undefined,
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
		savedMessage: ready ? sprintf( t( 'settings.saved' ), t( 'settings.appearance' ) ) : undefined,
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
		savedMessage: ready ? sprintf( t( 'settings.saved' ), t( 'settings.general' ) ) : undefined,
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
	} = useInitialCenter( currentMapEvent );

	const {
		layerInfos,
		onLayerChange,
	} = useLayerInfos();

	// Set CanvasAdapter props on app start, when mapSettingsInitialized, before the map gets initialized.
	useEffect( () => {
		if ( mapSettingsInitialized ) {
			CanvasAdapterModule.setLineScale( get( mapSettings, ['mapsforgeGeneral','lineScale'], defaults.mapSettings.mapsforgeGeneral.lineScale ) );
			CanvasAdapterModule.setTextScale( get( mapSettings, ['mapsforgeGeneral','textScale'], defaults.mapSettings.mapsforgeGeneral.textScale ) );
			CanvasAdapterModule.setSymbolScale( get( mapSettings, ['mapsforgeGeneral','symbolScale'], defaults.mapSettings.mapsforgeGeneral.symbolScale ) );
		}
	}, [mapSettingsInitialized] );

	const appInnerHeight = height - topAppBarHeight;

	useEffect( () => {
		if ( !! ( appDirs
			&& initialPosition
			&& mapSettingsInitialized
			&& appearanceSettingsInitialized
			&& generalSettingsInitialized
			&& uiStateInitialized
		) ) {
			setReady( true );
		}
	}, [
		appDirs,
		initialPosition,
		mapSettingsInitialized,
		appearanceSettingsInitialized,
		generalSettingsInitialized,
		uiStateInitialized,
	] );

	const {
		isUpdating,
		setIsUpdating,
	} = useUpdater( {
		ready,
		maybeIsBusyAdd,
		maybeIsBusyRemove,
	} );

	const style = {
		backgroundColor: theme.colors.background,
		height,
		width,
	};

	if ( ! ready || true === isUpdating ) {
		return  <View style={ style }>
			<SplashScreen/>
		</View>;
	}

	if ( false !== isUpdating ) {
		return  <View style={ style }>
			<SplashScreenUpdater
				isUpdating={ isUpdating }
				setIsUpdating={ setIsUpdating }
			/>
		</View>;
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

		<AppView
    		showSplash={ showSplash }
    		initialPosition={ initialPosition as InitialPosition }
    		setInitialPosition={ setInitialPosition }
    		setTopAppBarHeight={ setTopAppBarHeight }
    		setBottomBarHeight={ setBottomBarHeight }
    		setCurrentMapEvent={ setCurrentMapEvent }
    		setMapViewNativeNodeHandle={ setMapViewNativeNodeHandle }
    		layerInfos={ layerInfos }
    		onLayerChange={ onLayerChange }
		/>

	</AppContext.Provider>;
};

export default AppWrapper;