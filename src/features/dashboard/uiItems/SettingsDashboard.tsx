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
	const { mapHeight } = useContext(AppContext);

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

	const styleScrollView = useMemo(
		() => [
			style,
			{ height: mapHeight },
		],
		[style, mapHeight]
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
