/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../features/FeatureRegistry';
import { AppContext } from '../Context';

export const PADDING = 8; // see node_modules/react-native-paper/src/components/IconButton/IconButton.tsx

const buttonSize = 18;

const MapCornerComponents: FC = () => {
	const mapCornerComponents = useMemo(() => featureRegistry.getMapCornerComponents(), []);

	const { setMapCornerComponentsHeight, bottomBarHeight } = useContext(AppContext);

	const insets = useSafeAreaInsets();

	// When no bottom UI (drawer/dashboard) occupies the map's bottom edge,
	// the map extends under the navigation bar — lift the corner buttons by
	// the bottom inset. When bottom bars exist, the map already ends above
	// the system navigation bar.
	const bottomInset = useMemo(
		() =>
			Object.values(bottomBarHeight ?? {}).reduce((acc, nb) => acc + nb, 0) > 0
				? 0
				: insets.bottom,
		[bottomBarHeight, insets.bottom]
	);

	const handleLayout = useCallback(
		({ nativeEvent }: LayoutChangeEvent) => {
			setMapCornerComponentsHeight?.(nativeEvent.layout.height);
		},
		[setMapCornerComponentsHeight]
	);

	if (mapCornerComponents.length === 0) {
		return null;
	}

	return (
		<View
			style={[styles.wrapper, { bottom: bottomInset }]}
			onLayout={handleLayout}
		>
			{mapCornerComponents.map(({ key, Component, props }) => (
				<Component
					key={key}
					{...props}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		gap: 8,
		bottom: 0,
		right: PADDING,
		marginBottom: PADDING,
		marginRight: PADDING,
		justifyContent: 'center',
		alignItems: 'center',
		width: buttonSize,
		zIndex: 20,
	},
});

export default MapCornerComponents;
