/**
 * External dependencies
 */
import React, { FC, useContext } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

/**
 * Internaö dependencies
 */
import { AppContext } from '../../../../Context';
import CenterControl from '../../appearance/components/controls/CenterControl';
import ThemeControl from '../../appearance/components/controls/ThemeControl';

const SettingsAppearance: FC = () => {
	const theme = useTheme();
	const { width } = useSafeAreaFrame();
	const { appInnerHeight } = useContext(AppContext);

	return (
		<ScrollView
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
			}}
		>
			<ThemeControl />

			<CenterControl />
		</ScrollView>
	);
};

export default SettingsAppearance;
