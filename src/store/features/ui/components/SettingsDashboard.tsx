/**
 * External dependencies
 */
import { FC, useContext } from 'react';
import { View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import DashboardControlView from '../../dashboard/components/controls/DashboardControlView';

const SettingsDashboard: FC = () => {
	const theme = useTheme();

	const { width } = useSafeAreaFrame();

	const { appInnerHeight } = useContext(AppContext);

	return (
		<View
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
			}}
		>
			<DashboardControlView />
		</View>
	);
};

export default SettingsDashboard;
