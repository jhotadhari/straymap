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
import { getUiItemsByKey } from '../uiItems';
import { AppContext } from '../../../../Context';

const UiItemComponent: FC<{}> = () => {
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const { width } = Dimensions.get('window');

	const theme = useTheme();

	const { appInnerHeight } = useContext(AppContext);

	const Component = useMemo(() => {
		return uiItemsKeys.length
			? getUiItemsByKey(uiItemsKeys)[uiItemsKeys.length - 1].Component
			: undefined;
	}, [uiItemsKeys]);

	const style: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			height: appInnerHeight,
			width,
			position: 'absolute',
			zIndex: 30,
			paddingBottom: 24,
		}),
		[theme]
	);

	return Component ? <Component style={style} /> : undefined;
};

export default UiItemComponent;
