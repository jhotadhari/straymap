/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';
import BottomDrawerContext from '../BottomDrawerContext';
import { BottomDrawerItem } from '../types';

const BottomDrawerContent: FC<{}> = () => {
	const { activeItemKey } = useContext(BottomDrawerContext);

	const theme = useTheme();

	const DisplayComponent = useMemo(() => {
		if (!activeItemKey) {
			return undefined;
		}
		return get(
			featureRegistry.getBottomDrawerItems() as { [itemKey: string]: BottomDrawerItem },
			[activeItemKey, 'DisplayComponent']
		);
	}, [activeItemKey]);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.colors.background, borderColor: theme.colors.outline },
			]}
		>
			<DisplayComponent />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderTopWidth: 1,
	},
});

export default BottomDrawerContent;
