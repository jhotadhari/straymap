/**
 * External dependencies
 */
import { createIconSet } from '@react-native-vector-icons/common';

/**
 * Internal dependencies
 */
import glyphMap from '../../../assets/icons/build/glyphmap.json';
import { StyleSheet, View } from 'react-native';
import React from 'react';

const IconCustomGlyph = createIconSet(glyphMap, {
	postScriptName: 'build-icons',
	fontFileName: 'build-icons.ttf',
	fontSource: require('../../../assets/icons/build/build-icons.ttf'),
});

const styles = StyleSheet.create({
	glyph: {
		// Android adds asymmetric top/bottom padding from the font's
		// metrics — disabling it keeps the glyph vertically centered in
		// its line box (e.g. inside button labels).
		includeFontPadding: false,
	},
});

const IconCustom: React.FC<React.ComponentProps<typeof IconCustomGlyph>> = (props) => (
	<View>
		<IconCustomGlyph
			{...props}
			style={[props.style, styles.glyph]}
		/>
	</View>
);

export default IconCustom;
