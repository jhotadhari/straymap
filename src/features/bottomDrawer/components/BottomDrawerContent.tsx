/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../BottomDrawerContext';
import { getBottomDrawerItem } from '../dynamicItems';

const BottomDrawerContent: FC<{}> = () => {
	const { activeItemKey } = useContext(BottomDrawerContext);

	const theme = useTheme();

	const DisplayComponent = useMemo(
		() => (activeItemKey ? getBottomDrawerItem(activeItemKey)?.DisplayComponent : undefined),
		[activeItemKey]
	);

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
