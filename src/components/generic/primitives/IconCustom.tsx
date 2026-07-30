/**
 * External dependencies
 */
import { createIconSet } from '@react-native-vector-icons/common';

/**
 * Internal dependencies
 */
import glyphMap from '../../../assets/icons/build/glyphmap.json';

const IconCustom = createIconSet(glyphMap, {
	postScriptName: 'build-icons',
	fontFileName: 'build-icons.ttf',
	fontSource: require('../../../assets/icons/build/build-icons.ttf'),
});

export default IconCustom;
