/**
 * External dependencies
 */
import React, { FC } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import HardwareKeyControl from '../../general/components/controls/HardwareKeyControl';
import UnitPrefControl from '../../general/components/controls/UnitPrefControl';
import HgtControl from '../../general/components/controls/HgtControl';
import LangControl from '../../lang/components/controls/LangControl';

const SettingsGeneral: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<ScrollView style={style}>
			<LangControl />

			<HardwareKeyControl />

			<UnitPrefControl />

			<HgtControl />
		</ScrollView>
	);
};

export default SettingsGeneral;
