/**
 * External dependencies
 */
import {
	MD3DarkTheme,
	MD3LightTheme,
} from 'react-native-paper';
import { configureFonts } from 'react-native-paper';
import { get, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import type { ThemePropExtended } from './types';

const BlackTheme : ThemePropExtended = {
	...MD3DarkTheme,
    label: 'themeOptions.black',
	colors: {
		...MD3DarkTheme.colors,
		background: '#000',
		surface: '#000',
		elevation: {
			level0: 'transparent',
			// Note: Color values with transparency cause RN to transfer shadows to children nodes
			// instead of View component in Surface. Providing solid background fixes the issue.
			// Opaque color values generated with `palette.primary80` used as background
			level1: 'rgb(0, 0, 0)',
			level2: 'rgb(10, 10, 10)',
			level3: 'rgb(30, 30, 30)',
			level4: 'rgb(40, 40, 40)',
			level5: 'rgb(50, 50, 50)',
		},
	},
};

const themes : { [value: string]: ThemePropExtended } = {
	light: { ... MD3LightTheme, label: 'themeOptions.light' },
	dark: { ... MD3DarkTheme, label: 'themeOptions.dark' },
    black: BlackTheme,
};

// Loop themes, apply fonts and custom colors
Object.keys( themes ).map( ( key : string ) => {
	const fontConfig = { ...themes[key].fonts };
	Object.keys( fontConfig ).map( ( key : string ) => {
		set( fontConfig, key, {
			...get( fontConfig, key ),
			fontFamily: key.startsWith( 'display' )
				? 'jangly_walk'
				: 'F25_Executive',
		} )
	} );
	themes[key] = {
		...themes[key],
		fonts: configureFonts( { config: fontConfig } ),
	};
	// // Custom colors
	// const colorSuccess = themes[key].dark
	// 	? {
	// 		"success": "rgb(130, 219, 126)",
	// 		"onSuccess": "rgb(0, 57, 10)",
	// 		"successContainer": "rgb(0, 83, 18)",
	// 		"onSuccessContainer": "rgb(157, 248, 152)"
	// 	}
	// 	: {
	// 		"success": "rgb(16, 109, 32)",
	// 		"onSuccess": "rgb(255, 255, 255)",
	// 		"successContainer": "rgb(157, 248, 152)",
	// 		"onSuccessContainer": "rgb(0, 34, 4)"
	// 	};
	// // Use lodash set because ts is complaining
	// set( themes[key], 'colors', {
	// 	...themes[key].colors,
	// 	...colorSuccess,
	// } );
} );

export default themes;
