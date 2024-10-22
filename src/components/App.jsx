
/**
 * External dependencies
 */
import React, {
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

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';

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
	const [selectedTheme,setSelectedTheme] = useState( null );

	let themeOptions = [
		{ key: 'light', value: MD3LightTheme, label: t( 'themeOptions.light' ) },
		{ key: 'dark', value: MD3DarkTheme, label: t( 'themeOptions.dark' ) },
		{ key: 'black', value: BlackTheme, label: t( 'themeOptions.black' ) },
	];
	themeOptions = [
		{
			key: 'system',
			label: t( 'systemSetting' ),
			value: themeOptions.find( opt => opt.key === ( systemIsDarkMode ? 'dark' : 'light' ) ).value
		},
		...themeOptions,
	];

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

useAppLang = () => {

	const {t, i18n} = useTranslation();

	let langOptions = [
		{ key: 'system', label: t( 'systemSetting' ) },
		{ key: 'en', label: 'English' },
		{ key: 'de', label: 'Deutsch' },
	];

	const [selectedLang,setSelectedLang] = useState( null );

	const changeLang = newSelectedLang => {
		newSelectedLang = newSelectedLang != null && [...langOptions].map( opt => opt.key ).includes( newSelectedLang )
			? newSelectedLang
			: 'system';
		let newLang = i18n.lng;
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
			DefaultPreference.get( 'lang' ).then( newSelectedLang => {
				changeLang( newSelectedLang );
			} ).catch( err => 'ERROR' + console.log( err ) );
		}
	}, [] );

	useEffect( () => {
		if ( null !== selectedLang ) {
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

	if ( selectedTheme === null ) {
		return null;
	}

	if ( selectedLang === null ) {
		return null;
	}

	return <PaperProvider
		theme={ themeOptions.find( opt => opt.key === selectedTheme ).value }
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
} ) => {

	const theme = useTheme();

	const { t } = useTranslation();

	const {
		width,
		height,
	} = useWindowDimensions();

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
				justifyContent: 'space-around',
				alignItems: 'center',
			} }
		>

			<Text
				style={ { color: theme.colors.onBackground } }
			>{ t( 'test' ) }</Text>

			<View
				style={ {
					width,
					justifyContent: 'space-evenly',
					alignItems: 'center',
					flexDirection: 'row',
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

		</View>

	</SafeAreaView>;
};

export default AppWrapper;