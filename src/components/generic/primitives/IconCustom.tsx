/**
 * External dependencies
 */
import { createIconSet } from '@react-native-vector-icons/common';

/**
 * Internal dependencies
 */
import glyphMap from '../../../assets/icons/build/glyphmap.json';
import { View } from 'react-native';
import React from 'react';

const IconCustomGlyph = createIconSet(glyphMap, {
	postScriptName: 'build-icons',
	fontFileName: 'build-icons.ttf',
	fontSource: require('../../../assets/icons/build/build-icons.ttf'),
});

const IconCustom: React.FC<React.ComponentProps<typeof IconCustomGlyph>> = (props) => (
	<View>
		<IconCustomGlyph {...props} />
	</View>
);

export default IconCustom;
