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

	const styleContainer = useMemo(
		() => [
			styles.container,
			{ backgroundColor: theme.colors.background, borderColor: theme.colors.outline },
		],
		[theme]
	);

	if (!DisplayComponent) {
		return null;
	}

	return (
		<View style={styleContainer}>
			<DisplayComponent />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderTopWidth: 1,
		// Clip content while the drawer's height animates — without this
		// the display (e.g. header buttons) paints outside the drawer
		// during the slide-in. The handle is a sibling layer, unaffected.
		overflow: 'hidden',
	},
});

export default BottomDrawerContent;
