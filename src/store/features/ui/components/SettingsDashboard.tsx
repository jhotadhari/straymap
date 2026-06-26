/**
 * External dependencies
 */
import { FC, useContext, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DashboardControl from '../../dashboard/components/controls/DashboardControl';
import ItemControl from '../../dashboard/components/controls/ItemControl';
import { AppContext } from '../../../../Context';
import { useAppDispatch } from '../../../hooks';
import { setIsEditingDashboard, setEditItemKey } from '../../dashboard/slice';

const SettingsDashboard: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { mapHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setIsEditingDashboard(true));
		return () => {
			dispatch(setIsEditingDashboard(false));
			dispatch(setEditItemKey(undefined));
		};
	}, [
		dispatch,
	]);

	const styleScrollView = useMemo(
		() => [
			style,
			styles.scrollView,
			{ height: mapHeight },
		],
		[style, mapHeight]
	);

	return (
		<ScrollView
			scrollEnabled={true}
			style={styleScrollView}
		>
			<DashboardControl />

			{/* <GeneralControl /> */}

			<ItemControl />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollView: { zIndex: 10 },
});

export default SettingsDashboard;
