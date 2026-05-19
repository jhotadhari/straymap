/**
 * External dependencies
 */
import { FC } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DashboardControlView from '../../dashboard/components/controls/DashboardControlView';

const SettingsDashboard: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View
			style={[
				style,
				{
					zIndex: 10,
				},
			]}
		>
			<DashboardControlView />
		</View>
	);
};

export default SettingsDashboard;
