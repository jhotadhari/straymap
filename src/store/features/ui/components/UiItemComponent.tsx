/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { selectUiItemKeys } from '../selectors';
import { useAppSelector } from '../../../hooks';
import { getUiItemsByKey } from '../uiItems';

const UiItemComponent: FC<{}> = () => {
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const Component = useMemo(() => {
		return () => uiItemsKeys.length ? getUiItemsByKey(uiItemsKeys)[uiItemsKeys.length - 1].Component : undefined;
	}, [uiItemsKeys]);

	return Component ? <Component /> : undefined;
};

export default UiItemComponent;
