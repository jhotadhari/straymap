
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
	Text,
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
	MD3DarkTheme,
	MD3LightTheme,
	Button,
	Menu,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeProp } from 'react-native-paper/lib/typescript/types';

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
	// LayerScalebar,
	// useRenderStyleOptions,
	// nativeMapModules,
	useMapEvents,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';

type ThemeOption = {
	key: string;
	value: ThemeProp;
	label: string;
};

type LangOption = {
	key: string;
	label: string;
};

const BlackTheme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		background: '#000',
	}
};

const useAppTheme = () => {

	const { t } = useTranslation();

	const systemIsDarkMode = useColorScheme() === 'dark';
	const [selectedTheme,setSelectedTheme] = useState<null | string>( null );

	let themeOptions : ThemeOption[] = [
		{ key: 'light', value: MD3LightTheme, label: t( 'themeOptions.light' ) },
		{ key: 'dark', value: MD3DarkTheme, label: t( 'themeOptions.dark' ) },
		{ key: 'black', value: BlackTheme, label: t( 'themeOptions.black' ) },
	];

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
	// useEffect( () => {
	// 	if ( ! theme ) {
	// 		console.log( 'debug should fix theme???', theme ); // debug
	// 		// setSelectedTheme( 'system' );
	// 	}
	// }, [theme] )

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

const ThemeControl = ( {
	selectedTheme,
	setSelectedTheme,
	themeOptions,
} : {
	selectedTheme: string,
	setSelectedTheme: Dispatch<SetStateAction<string | null>>;
	themeOptions: ThemeOption[],
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [visible,setVisible] = useState( false );
	return <Menu
		visible={ visible }
		onDismiss={ () => setVisible( false ) }
		anchor={
			<Button
				icon="invert-colors"
				onPress={ () => setVisible( ! visible ) }
				mode={ 'outlined' }
			>
				<Text>{ t( 'selectTheme' ) }</Text>
			</Button>
		}>
			{ [...themeOptions].map( opt => <Menu.Item
				key={ opt.key }
				onPress={ () => {
					setSelectedTheme( opt.key );
					setVisible( false );
				} }
				title={ opt.label }
				style={ opt.key === selectedTheme && {
					backgroundColor: theme.colors.primary,
				} }
				titleStyle={ opt.key === selectedTheme && {
					color: theme.colors.onPrimary,
				} }
			/> ) }
	</Menu>;
};

const LangControl = ( {
	langOptions,
	changeLang,
	selectedLang,
} : {
	langOptions: LangOption[],
	changeLang: ( newSelectedLang : string ) => void;
	selectedLang: string,
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [visible,setVisible] = useState( false );
	return <Menu
		visible={ visible }
		onDismiss={ () => setVisible( false ) }
		anchor={
			<Button
				icon={ ( { size, color }) => <MaterialIcons name="language" size={ size } color={ color } /> }
				onPress={ () => setVisible( ! visible ) }
				mode={ 'outlined' }
			>
				<Text>{ t( 'selectLang' ) }</Text>
			</Button>
		}>
			{ [...langOptions].map( opt => <Menu.Item
				key={ opt.key }
				onPress={ () => {
					changeLang( opt.key );
					setVisible( false );
				} }
				title={ opt.label }
				style={ opt.key === selectedLang && {
					backgroundColor: theme.colors.primary,
				} }
				titleStyle={ opt.key === selectedLang && {
					color: theme.colors.onPrimary,
				} }
			/> ) }
	</Menu>;
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
	langOptions: LangOption[],
	changeLang: ( newSelectedLang : string ) => void;
	selectedLang: string,
} ) => {

	const theme = useTheme();

	const { t } = useTranslation();

	const {
		width,
		height,
	} = useWindowDimensions();

	const [mapViewNativeNodeHandle, setMapViewNativeNodeHandle] = useState<null | number>( null );

	useMapEvents( {
		nativeNodeHandle: mapViewNativeNodeHandle,
		onMapEvent: event => {
			console.log( 'onMapEvent event', event ); // debug
		},
	} );

	return <SafeAreaView style={ {
		backgroundColor: theme.colors.background,
		height,
		width,
	} }>
		<StatusBar
			barStyle={ theme.dark ? 'dark-content' : 'light-content' }
			backgroundColor={ theme.colors.background }
		/>

		<View
			style={ {
				width,
				height,
				justifyContent: 'space-evenly',
				alignItems: 'center',
			} }
		>

			<Text
				style={ {
					color: theme.colors.onBackground,
					marginBottom: 10,
				} }
			>{ t( 'test' ) }</Text>

			<View
				style={ {
					width,
					justifyContent: 'space-evenly',
					alignItems: 'center',
					flexDirection: 'row',
					marginBottom: 10
				} }
			>

				<ThemeControl
					selectedTheme={ selectedTheme }
					setSelectedTheme={ setSelectedTheme }
					themeOptions={ themeOptions }
				/>

				<LangControl
					langOptions={ langOptions }
					changeLang={ changeLang }
					selectedLang={ selectedLang }
				/>


			</View>

			<View>

				<MapContainer
					nativeNodeHandle={ mapViewNativeNodeHandle }
					setNativeNodeHandle={ setMapViewNativeNodeHandle }
					responseInclude={ { center: 2 } }
					height={ 500 }
					width={ width /* defaults to full width */ }
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

					<LayerBitmapTile
						url={ 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png' }
						cacheSize={ 10 * 1024 * 1024 }
					/>

				</MapContainer>
			</View>

		</View>

	</SafeAreaView>;
};

export default AppWrapper;