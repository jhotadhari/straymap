/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { selectUiItemKeys } from '../selectors';
import { useAppSelector } from '../../../store/hooks';
import { featureRegistry } from '../../FeatureRegistry';
import { AppContext } from '../../../Context';

const UiItemComponent: FC<{}> = () => {
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const { width } = useMemo(() => Dimensions.get('window'), []);

	const theme = useTheme();

	const { appInnerHeight } = useContext(AppContext);

	const Component = useMemo(() => {
		if (!uiItemsKeys.length) return undefined;
		const activeKey = uiItemsKeys[uiItemsKeys.length - 1];
		const allItems = featureRegistry.getUiItems();
		const match = allItems.find((item) => item.key === activeKey);
		return match?.Component;
	}, [uiItemsKeys]);

	const style: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			height: appInnerHeight,
			width,
			position: 'absolute',
			zIndex: 100,
		}),
		[
			theme,
			appInnerHeight,
			width,
		]
	);

	const styleMapCover: StyleProp<ViewStyle> = useMemo(
		() => [styles.mapCover, { backgroundColor: theme.colors.background }],
		[theme]
	);

	return Component ? (
		<>
			<View style={styleMapCover} />
			<Component style={style} />
		</>
	) : undefined;
};

const styles = StyleSheet.create({
	mapCover: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 90,
	},
});

export default UiItemComponent;
