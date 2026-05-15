/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ItemUnitPrefControl from '../../components/controls/ItemUnitPrefControl';
import ItemFontSizeControl from '../../components/controls/ItemFontSizeControl';
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';

const Control: FC = () => {
	return (
		<View>
			<ItemUnitPrefControl unitPrefsKey="coordinates" />

			<ItemMinWidthControl />

			<ItemFontSizeControl />
		</View>
	);
};

export default Control;
