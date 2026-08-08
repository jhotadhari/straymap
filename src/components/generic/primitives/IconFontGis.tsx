/**
 * External dependencies
 */
import { createIconSet } from '@react-native-vector-icons/common';

/**
 * Internal dependencies
 */
import fontGisConfig from 'font-gis/font-gis.json';

const glyphMap = Object.values(fontGisConfig.glyphs).reduce<{
	[key: string]: number;
}>((acc, glyph) => {
	acc[glyph.name] = glyph.code;
	return acc;
}, {});

const IconFontGis = createIconSet(glyphMap, {
	postScriptName: 'font-gis',
	fontFileName: 'font-gis.ttf',
	fontSource: require('font-gis/fonts/font-gis.ttf'),
});

export default IconFontGis;
