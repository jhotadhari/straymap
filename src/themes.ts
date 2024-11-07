
import {
	MD3DarkTheme,
} from 'react-native-paper';

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
    black: BlackTheme,
};

export default themes;
