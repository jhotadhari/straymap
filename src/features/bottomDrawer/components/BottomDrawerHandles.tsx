/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView, ComposedGesture, GestureType } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectActiveKey, selectItemKeys } from '../selectors';
import BottomDrawerContext from '../BottomDrawerContext';
import BottomDrawerHandle from './BottomDrawerHandle';
import { BOTTOM_DRAWER_HANDLE_HEIGHT } from '../constants';

const BottomDrawerHandles: FC<{
	gesture: ComposedGesture | GestureType;
}> = ({ gesture }) => {
	const itemKeys = useAppSelector(selectItemKeys);
	const activeItemKey = useAppSelector(selectActiveKey);

	const { setActiveItemKey, expand, getIsFullyCollapsed } = useContext(BottomDrawerContext);

	const handleItemPress = useCallback(
		(itemKey: string) => {
			if (itemKey === activeItemKey) {
				expand(getIsFullyCollapsed());
			} else {
				setActiveItemKey(itemKey);
				if (getIsFullyCollapsed()) {
					expand(true);
				}
			}
		},
		[
			activeItemKey,
			expand,
			getIsFullyCollapsed,
			setActiveItemKey,
		]
	);

	// Memoized per-item press handlers so BottomDrawerHandle doesn't re-render
	// from inline () => {} props.
	const handleItemPressMap = useMemo(() => {
		const map: Record<string, () => void> = {};
		itemKeys.forEach((itemKey) => {
			map[itemKey] = () => handleItemPress(itemKey);
		});
		return map;
	}, [itemKeys, handleItemPress]);

	return (
		<View style={styles.wrapper}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
			>
				{itemKeys.map((itemKey) => (
					<BottomDrawerHandle
						key={itemKey}
						itemKey={itemKey}
						gesture={gesture}
						onPress={handleItemPressMap[itemKey]}
					/>
				))}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: BOTTOM_DRAWER_HANDLE_HEIGHT,
		// Poke up above the drawer's top edge so the pills overlap the map.
		transform: [{ translateY: -BOTTOM_DRAWER_HANDLE_HEIGHT }],
	},
	scrollView: {
		height: BOTTOM_DRAWER_HANDLE_HEIGHT,
	},
	scrollViewContent: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'flex-end',
	},
});

export default BottomDrawerHandles;
