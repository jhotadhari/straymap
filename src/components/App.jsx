
/**
 * External dependencies
 */
import React, {
	useEffect,
	useState,
	useRef,
} from 'react';
import {
	SafeAreaView,
	StatusBar,
	Text,
	useColorScheme,
	useWindowDimensions,
	View,
} from 'react-native';
import 'intl-pluralrules';
import { useTranslation } from 'react-i18next';
import {
	PaperProvider,
	useTheme,
	Button,
	MD3DarkTheme,
	MD3LightTheme,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Internal dependencies
 */
import '../assets/i18n/i18n';

const DarkTheme = {
	...MD3DarkTheme,
	colors: {
		...MD3DarkTheme.colors,
		background: '#000',
	}
};

const AppThemeWrapper = () => {

	const systemIsDarkMode = useColorScheme() === 'dark';

	const [isDarkMode,setIsDarkMode] = useState( systemIsDarkMode );

	return <PaperProvider
		theme={ isDarkMode ? DarkTheme : MD3LightTheme }
	>
		<App
			isDarkMode={ isDarkMode }
			setIsDarkMode={ setIsDarkMode }
		/>
	</PaperProvider>;
};

const App = ( {
	isDarkMode,
	setIsDarkMode,
} ) => {

	const theme = useTheme();

	const {t, i18n} = useTranslation();

	const [currentLanguage,setLanguage] = useState( 'en' );

	const changeLanguage = value => {
		i18n
			.changeLanguage( value )
			.then( () => setLanguage( value ))
			.catch( err => console.log( err ) );
	};

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
			barStyle={ isDarkMode ? 'light-content' : 'dark-content' }
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
				<Button
					onPress={ () => changeLanguage( 'en' ) }
					icon={ ( { size, color }) => <MaterialIcons name="language" size={ size } color={ color } /> }
					mode={ currentLanguage === 'en' ? 'contained' : 'outlined' }
				>
					<Text>Select English</Text>
				</Button>

				<Button
					icon={ ( { size, color }) => <MaterialIcons name="language" size={ size } color={ color } /> }
					onPress={ () => changeLanguage( 'de' ) }
					mode={ currentLanguage === 'de' ? 'contained' : 'outlined' }
				>
					<Text>Sprache wählen</Text>
				</Button>

			</View>

			<Button
				icon="invert-colors"
				onPress={ () => setIsDarkMode( ! isDarkMode ) }
				mode={ currentLanguage === 'de' ? 'contained' : 'outlined' }
			>
				<Text>{ t( 'toggleTheme' ) }</Text>
			</Button>

		</View>

	</SafeAreaView>;
};

export default AppThemeWrapper;