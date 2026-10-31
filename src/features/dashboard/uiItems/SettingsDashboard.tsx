/**
 * External dependencies
 */
import { FC, useContext, useEffect, useMemo } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DashboardControl from '../components/controls/DashboardControl';
import ItemControl from '../components/controls/ItemControl';
import { AppContext } from '../../../Context';
import { useAppDispatch } from '../../../store/hooks';
import { setIsEditingDashboard, setEditItemKey } from '../slice';
import useKeyboardShown from '../../../compose/useKeyboardShown';

const SettingsDashboard: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { mapHeight, appInnerHeight, bottomBarHeight } = useContext(AppContext);

	const { keyboardHeight } = useKeyboardShown();

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

	// Use the full page height minus the reserved bottom-dashboard band.
	// `mapHeight` also subtracts the bottom drawer (chart) height, but the
	// drawer is hidden behind this page's opaque cover — letting it shrink
	// the viewport only cuts the accordion content off.
	const scrollViewHeight = useMemo(
		() => (appInnerHeight ?? mapHeight ?? 0) - (bottomBarHeight?.dashboard ?? 0),
		[appInnerHeight, mapHeight, bottomBarHeight]
	);

	const styleScrollView = useMemo(
		() => [
			style,
			{ height: scrollViewHeight },
		],
		[style, scrollViewHeight]
	);

	const containerPadding = useMemo(
		() => (keyboardHeight ? { paddingBottom: keyboardHeight } : undefined),
		[keyboardHeight]
	);

	return (
		<ScrollView
			scrollEnabled={true}
			style={styleScrollView}
			contentContainerStyle={containerPadding}
			keyboardShouldPersistTaps="handled"
		>
			<DashboardControl />

			<ItemControl />
		</ScrollView>
	);
};

export default SettingsDashboard;
