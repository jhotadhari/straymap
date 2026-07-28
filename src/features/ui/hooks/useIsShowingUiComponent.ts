/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { selectUiItemKeys } from '../selectors';
import { useAppSelector } from '../../../store/hooks';
import { featureRegistry } from '../../FeatureRegistry';

const useIsShowingUiComponent = () => {
	const uiItemsKeys = useAppSelector(selectUiItemKeys);
	return useMemo(() => {
		if (!uiItemsKeys.length) return undefined;
		const activeKey = uiItemsKeys[uiItemsKeys.length - 1];
		const allItems = featureRegistry.getUiItems();
		return allItems.some((item) => item.key === activeKey);
	}, [uiItemsKeys]);
};

export default useIsShowingUiComponent;
