
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

/**
 * react-native-mapsforge-vtm
 */
import {
	MapContainer,
	LayerBitmapTile,
	// LayerMapsforge,
	// LayerMBTilesBitmap,
	// LayerHillshading,
	// LayerPathSlopeGradient,
	LayerScalebar,
	// useRenderStyleOptions,
	// nativeMapModules,
	useMapEvents,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';
import TopAppBar from './TopAppBar';
import type { OptionBase, HierarchyItem, ThemeOption, AbsPathsMap, MapConfig, MapSettings } from '../types';
import customThemes from '../themes';
import { AppContext } from '../Context';
import Center from './Center';
import { HelperModule } from '../nativeModules';
import { get } from 'lodash-es';

const useAppTheme = () => {

	const { t } = useTranslation();

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
			DefaultPreference.set( 'theme', selectedTheme ).catch( err => 'ERROR' + console.log( err ) );
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

	const [selectedLang,setSelectedLang] = useState<null | string>( null );

	const changeLang = ( newSelectedLang : string ) : void => {
		newSelectedLang = newSelectedLang != null && [...langOptions].map( opt => opt.key ).includes( newSelectedLang )
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
			DefaultPreference.get( 'lang' ).then( ( newSelectedLang : string | null | undefined ) => {
				if ( newSelectedLang ) {
					changeLang( newSelectedLang );
				}
			} ).catch( err => 'ERROR' + console.log( err ) );
		}
	}, [] );

	useEffect( () => {
		if ( selectedLang ) {
			DefaultPreference.set( 'lang', selectedLang ).catch( err => 'ERROR' + console.log( err ) );
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

const useMapSettings = () => {
	const [initialized,setInitialized] = useState( false );
	const [mapSettings,setMapSettings] = useState<MapSettings>( {
		layers: [],
	} );
    useEffect( () => {
		DefaultPreference.get( 'mapSettings' ).then( newMapSettings => {
			if ( newMapSettings ) {
				setMapSettings( JSON.parse( newMapSettings ) );
			}
			setInitialized( true );
		} ).catch( err => 'ERROR' + console.log( err ) );
    }, [] );

	useEffect( () => {
		if ( initialized ) {
			// console.log( 'debug save mapSettings', mapSettings ); // debug
			DefaultPreference.set( 'mapSettings', JSON.stringify( mapSettings ) )
			.catch( err => 'ERROR' + console.log( err ) );
		}
	}, [mapSettings] )
	return {
		mapSettings,
		setMapSettings,
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

	const theme = useTheme();
	const systemIsDarkMode = useColorScheme() === 'dark';
	const [topAppBarHeight,setTopAppBarHeight] = useState<number>( 0 );

	const [selectedHierarchyItems,setSelectedHierarchyItems] = useState<null | HierarchyItem[]>( null );

	const {
		width,
		height,
	} = useWindowDimensions();

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>( null );

	const [appDirs,setAppDirs] = useState<null | AbsPathsMap>( null );

	useEffect( () => {
		HelperModule.getAppDirs().then( ( dirs : AbsPathsMap ) => {
			setAppDirs( dirs );
		} ).catch( ( err: any ) => console.log( 'ERROR', err ) );
	}, [] );

	useMapEvents( {
		nativeNodeHandle: mapViewNativeNodeHandle,
		onMapEvent: event => {
			console.log( 'onMapEvent event', event ); // debug
		},
	} );

	const {
		mapSettings,
		setMapSettings,
	} = useMapSettings();

	const mapHeight = height - topAppBarHeight;

	if ( ! appDirs ) {
		return null;
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
		mapHeight,
		topAppBarHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
		mapSettings,
		setMapSettings,
	} }>
		<SafeAreaView style={ {
			backgroundColor: theme.colors.background,
			height,
			width,
		} }>

			<StatusBar barStyle={ systemIsDarkMode ? 'light-content' : 'dark-content' } />

			<TopAppBar setTopAppBarHeight={ setTopAppBarHeight } />

			<View style={ {
				height: mapHeight,
				width,
			} } >

				{ selectedHierarchyItems !== null && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity && selectedHierarchyItems[selectedHierarchyItems.length-1].SubActivity }

				<MapContainer
					nativeNodeHandle={ mapViewNativeNodeHandle }
					setNativeNodeHandle={ setMapViewNativeNodeHandle }
					responseInclude={ { center: 2, zoomLevel: 2 } }
					height={ mapHeight }
					width={ width }
					center={ {
						lng: -70.239,
						lat: -10.65,
					} }
					zoomLevel={ 12 }
					minZoom={ 2 }
					maxZoom={ 20 }
					moveEnabled={ true }
					tiltEnabled={ false }
					rotationEnabled={ false }
					zoomEnabled={ true }
					onPause={ response => console.log( 'lifecycle event onPause', response ) }
					onResume={ response => console.log( 'lifecycle event onResume', response ) }
				>

					{ [...mapSettings.layers].map( ( layer : MapConfig ) => {
						if ( layer.type && layer.visible ) {
							switch( layer.type ) {
								case 'online-raster-xyz':
									return <LayerBitmapTile
										key={ layer.key }
										zoomMin={ layer.options.zoomMin }
										zoomMax={ layer.options.zoomMax }
										url={ get( layer.options, 'url', '' ) }
										cacheSize={ get( layer.options, 'cacheSize', 0 ) * 1024 * 1024 }
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

			</View>

		</SafeAreaView>
	</AppContext.Provider>;
};

export default AppWrapper;