/**
 * External dependencies
 */
import { FC, useContext, useEffect } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DashboardControl from '../../dashboard/components/controls/DashboardControl';
import ItemControl from '../../dashboard/components/controls/ItemControl';
import { AppContext } from '../../../../Context';
import { useAppDispatch } from '../../../hooks';
import { setIsEditingDashboard, setEditItemKey } from '../../dashboard/dashboardSlice';

const SettingsDashboard: FC<{ style?: ViewStyle }> = ({ style }) => {

	const { mapHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setIsEditingDashboard(true));
		return () => {
			dispatch(setIsEditingDashboard(false));
			dispatch(setEditItemKey(undefined));
		};
	}, []);

	return (
		<ScrollView
			scrollEnabled={true}
			style={[
				style,
				{
					zIndex: 10,
					height: mapHeight,
				},
			]}
		>
			<DashboardControl />

			{/* <GeneralControl /> */}

			<ItemControl />
		</ScrollView>
	);
};

export default SettingsDashboard;
