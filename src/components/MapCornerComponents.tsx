/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../features/FeatureRegistry';

const PADDING = 8; // see node_modules/react-native-paper/src/components/IconButton/IconButton.tsx

const buttonSize = 18;

const MapCornerComponents: FC = () => {
	const mapCornerComponents = useMemo(() => featureRegistry.getMapCornerComponents(), []);

	if (mapCornerComponents.length === 0) {
		return null;
	}

	return (
		<View style={styles.wrapper}>
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
