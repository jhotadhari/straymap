/**
 * External dependencies
 */
// import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { createIconSet } from '@react-native-vector-icons/common';

/**
 * Internal dependencies
 */
import icoMoonConfig from '../../assets/icons/icomoon/selection.json';

const glyphMap = icoMoonConfig.icons.reduce<{ [key: string]: number }>((acc, icon) => {
	acc[icon.properties.name] = icon.properties.code;
	return acc;
}, {});

const IconIcomoon = createIconSet(glyphMap, {
	postScriptName: 'icomoon',
	fontFileName: 'icomoon.ttf',
	fontSource: require('../../assets/icons/icomoon/fonts/icomoon.ttf'), // optional, for dynamic loading. Can also be a local file uri.
});

export default IconIcomoon;
