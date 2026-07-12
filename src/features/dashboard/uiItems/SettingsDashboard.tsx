/**
 * External dependencies
 */
import { FC, useContext, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DashboardControl from '../components/controls/DashboardControl';
import ItemControl from '../components/controls/ItemControl';
import { AppContext } from '../../../Context';
import { useAppDispatch } from '../../../store/hooks';
import { setIsEditingDashboard, setEditItemKey } from '../slice';

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

			<ItemControl />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollView: { zIndex: 10 },
});

export default SettingsDashboard;
