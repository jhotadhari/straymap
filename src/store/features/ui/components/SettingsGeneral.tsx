/**
 * External dependencies
 */
import React, { FC, useContext } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import HardwareKeyControl from '../../general/components/controls/HardwareKeyControl';
import UnitPrefControl from '../../general/components/controls/UnitPrefControl';
import HgtControl from '../../general/components/controls/HgtControl';
// import DashboardControl from '../../dashboard/OLD/DashboardControlOld';
import LangControl from '../../general/components/controls/LangControl';

const SettingsGeneral: FC = () => {
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
			<LangControl />

			<HardwareKeyControl />

			<UnitPrefControl />

			{/* <DashboardControl /> */}

			<HgtControl />
		</ScrollView>
	);
};

export default SettingsGeneral;
