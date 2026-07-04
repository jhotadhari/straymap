/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { Dimensions, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { selectUiItemKeys } from '../selectors';
import { useAppSelector } from '../../../hooks';
import { featureRegistry } from '../../FeatureRegistry';
import { AppContext } from '../../../../Context';

const UiItemComponent: FC<{}> = () => {
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const { width } = Dimensions.get('window');

	const theme = useTheme();

	const { appInnerHeight } = useContext(AppContext);

	const Component = useMemo(() => {
		if (!uiItemsKeys.length) return undefined;
		const activeKey = uiItemsKeys[uiItemsKeys.length - 1];
		const allItems = featureRegistry.getSettingsItems();
		const match = allItems.find((item) => item.key === activeKey);
		return match?.Component;
	}, [uiItemsKeys]);

	const style: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			height: appInnerHeight,
			width,
			position: 'absolute',
			zIndex: 30,
		}),
		[
			theme,
			appInnerHeight,
			width,
		]
	);

	return Component ? <Component style={style} /> : undefined;
};

export default UiItemComponent;
