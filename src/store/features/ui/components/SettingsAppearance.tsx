/**
 * External dependencies
 */
import React, { FC } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import CenterControl from '../../appearance/components/controls/CenterControl';
import ThemeControl from '../../appearance/components/controls/ThemeControl';

const SettingsAppearance: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<ScrollView style={style}>
			<ThemeControl />

			<CenterControl />
		</ScrollView>
	);
};

export default SettingsAppearance;
