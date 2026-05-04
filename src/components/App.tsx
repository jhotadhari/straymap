/**
 * External dependencies
 */
import React, {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	View,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import DefaultPreference from 'react-native-default-preference';
import {
	PaperProvider,
	useTheme,
} from 'react-native-paper';
import { get, pick } from 'lodash-es';
import semverCompare from 'semver-compare';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
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
import type {
	HierarchyItem,
	AbsPathsMap,
	LayerInfos,
	InitialPosition,
	UpdaterSettings,
	UpdateResults,
	BottomBarHeight,
} from '../types';
import { AppContext, MapContext } from '../Context';
import { HelperModule } from '../nativeModules';
import { defaults } from '../constants';
import SplashScreen from './SplashScreen';
import AppView from './AppView';
import SplashScreenUpdater from './SplashScreenUpdater';
import useSettings from '../compose/useSettings';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RoutingProvider from './RoutingProvider';
import { selectInitialized as selectSettingsInitialized_appearance } from '../store/features/appearance/selectors';
import { selectInitialized as selectSettingsInitialized_dashboard } from '../store/features/dashboard/selectors';
import { selectInitialized as selectSettingsInitialized_general } from '../store/features/general/selectors';
import { selectMapsforgeGeneral, selectInitialized as selectSettingsInitialized_baseMap } from '../store/features/baseMap/selectors';
import { useAppSelector } from '../store/hooks';
import { useSetupTheme } from '../store/features/appearance/hooks';
import { selectElements } from '../store/features/dashboard/selectors';
import { selectInitialized as selectSettingsInitialized_ui, selectIsBusy } from '../store/features/ui/selectors';
import { useIsBusyPromiseQueueState } from '../store/features/ui/hooks';

const AppWrapper = () => {

	const theme = useSetupTheme();

	return <PaperProvider
		theme={ theme }
	>
		<App/>
	</PaperProvider>;
};

const useInitialCenter = ( currentMapEventRef: MutableRefObject<MapEventResponse | null> ) => {
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
} : {
	ready: boolean;
} ) => {

	let {
		settings: updaterSettings,
		setSettings: setUpdaterSettings,
		initialized: updaterSettingsInitialized,
	} = useSettings( {
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

const App = () => {

	const theme = useTheme();
	const [ready,setReady] = useState<boolean>( false );
	const [topAppBarHeight,setTopAppBarHeight] = useState<number>( 0 );
	const [bottomBarHeight,setBottomBarHeight] = useState<BottomBarHeight>( {} );
	const [selectedHierarchyItems,setSelectedHierarchyItems] = useState<null | HierarchyItem[]>( null );

	const currentMapEventRef = useRef<MapEventResponse | null>( null );

	useIsBusyPromiseQueueState();
	const isBusy = useAppSelector( selectIsBusy );

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

	const settingsInitialized_appearance = useAppSelector( selectSettingsInitialized_appearance );
	const settingsInitialized_dashboard = useAppSelector( selectSettingsInitialized_dashboard );
	const settingsInitialized_general = useAppSelector( selectSettingsInitialized_general );
	const settingsInitialized_ui = useAppSelector( selectSettingsInitialized_ui );
	const settingsInitialized_baseMap = useAppSelector( selectSettingsInitialized_baseMap );

	// Remove bottomBar if no dashboard elements.
	const dashboardElements = useAppSelector( selectElements );
	useEffect( () => {
		if ( ! dashboardElements.length ) {
			setBottomBarHeight( bottomBarHeight => ( {
				...bottomBarHeight,
				dashboard: 0,
			} ) );
		}
	}, [dashboardElements] );

	const {
		initialPosition,
		setInitialPosition,
	} = useInitialCenter( currentMapEventRef );

	const {
		layerInfos,
		onLayerChange,
	} = useLayerInfos();

	const mapsforgeGeneral = useAppSelector( selectMapsforgeGeneral );

	// Set CanvasAdapter props on app start, when settingsInitialized_baseMap, before the map gets initialized.
	useEffect( () => {
		if ( settingsInitialized_baseMap ) {
			CanvasAdapterModule.setLineScale( mapsforgeGeneral.lineScale );
			CanvasAdapterModule.setTextScale( mapsforgeGeneral.textScale );
			CanvasAdapterModule.setSymbolScale( mapsforgeGeneral.symbolScale );
		}
	}, [settingsInitialized_baseMap, mapsforgeGeneral] );

	const appInnerHeight = height - topAppBarHeight;

	useEffect( () => {
		if ( !! ( appDirs
			&& initialPosition
			&& settingsInitialized_appearance
			&& settingsInitialized_dashboard
			&& settingsInitialized_general
			&& settingsInitialized_ui
			&& settingsInitialized_baseMap
		) ) {
			setReady( true );
		}
	}, [
		appDirs,
		initialPosition,
		settingsInitialized_appearance,
		settingsInitialized_dashboard,
		settingsInitialized_general,
		settingsInitialized_ui,
		settingsInitialized_baseMap,
	] );

	const {
		isUpdating,
		setIsUpdating,
	} = useUpdater( {
		ready,
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
		mapViewNativeNodeHandle,
		appInnerHeight,
		topAppBarHeight,
		bottomBarHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
		mapHeight: ( appInnerHeight || height ) - ( Object.values( bottomBarHeight ).reduce( ( acc, nb ) => acc + nb, 0 ) || 0 ),
	} }>
		<MapContext.Provider value={ {
			currentMapEventRef,
		} }>
			<RoutingProvider>
				<GestureHandlerRootView>
					<AppView
						showSplash={ showSplash }
						initialPosition={ initialPosition as InitialPosition }
						setInitialPosition={ setInitialPosition }
						setTopAppBarHeight={ setTopAppBarHeight }
						setBottomBarHeight={ setBottomBarHeight }
						setMapViewNativeNodeHandle={ setMapViewNativeNodeHandle }
						layerInfos={ layerInfos }
						onLayerChange={ onLayerChange }
					/>
				</GestureHandlerRootView>
			</RoutingProvider>
		</MapContext.Provider>
	</AppContext.Provider>;
};

export default AppWrapper;