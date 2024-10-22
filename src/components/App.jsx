
/**
 * External dependencies
 */
import React, {
	useEffect,
	useState,
	useRef,
} from 'react';
import {
	Button,
	SafeAreaView,
	StatusBar,
	Text,
	useColorScheme,
	useWindowDimensions,
	PixelRatio,
	View,
	Pressable,
	NativeEventEmitter,
} from 'react-native';


import '../assets/i18n/i18n';

import 'intl-pluralrules';
import {useTranslation} from 'react-i18next';

const App = () => {

	const isDarkMode = useColorScheme() === 'dark';

	const style = {
		backgroundColor: isDarkMode ? 'black' : '#eee',
		color: isDarkMode ? '#eee' : 'black',
	};




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

	return (
		<SafeAreaView style={ {
			...style,
			height,
			width,
		} }>
			<StatusBar
				barStyle={ isDarkMode ? 'light-content' : 'dark-content' }
				backgroundColor={ style.backgroundColor }
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
					style={ { marginBottom: 10 } }
				>{ t( 'test' ) }</Text>

				<View
					style={ {
						width,
						justifyContent: 'space-evenly',
						alignItems: 'center',
						flexDirection: 'row',
					} }
				>
					<Pressable
						onPress={ () => changeLanguage( 'en' ) }
						style={ {
							backgroundColor: currentLanguage === 'en' ? '#555' : style.backgroundColor,
							padding: 10,
						} }
					>
						<Text>Select English</Text>
					</Pressable>

					<Pressable
						onPress={ () => changeLanguage( 'de' ) }
						style={{
							backgroundColor: currentLanguage === 'de' ? '#555' : style.backgroundColor,
						} }
					>
						<Text>Sprache wählen</Text>
					</Pressable>

				</View>
			</View>

		</SafeAreaView>
	);
};

export default App;