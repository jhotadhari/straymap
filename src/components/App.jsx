
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
	NativeEventEmitter,
} from 'react-native';


const App = () => {

	const isDarkMode = useColorScheme() === 'dark';

	const style = {
		backgroundColor: isDarkMode ? 'black' : '#eee',
		color: isDarkMode ? '#eee' : 'black',
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
				>That's just a test string</Text>

			</View>

		</SafeAreaView>
	);
};

export default App;