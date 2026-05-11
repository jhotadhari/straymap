/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { selectHierarchyItemKeys } from '../selectors';
import { useAppSelector } from '../../../hooks';
import { getHierarchyItemsByKey } from '../hierarchyItems';

const SubActivity: FC<{}> = () => {
	const hierarchyItemsKeys = useAppSelector(selectHierarchyItemKeys);

	const SubActivityComponent = useMemo(() => {
		const hierarchyItems = getHierarchyItemsByKey(hierarchyItemsKeys);

		console.log('debug hierarchyItemsKeys', hierarchyItemsKeys); // debug
		console.log('debug hierarchyItems', hierarchyItems); // debug

		if (
			hierarchyItems &&
			hierarchyItems.length &&
			hierarchyItems[hierarchyItems.length - 1].SubActivity
		) {
			return () => hierarchyItems[hierarchyItems.length - 1].SubActivity;
		}
		return undefined;
	}, [hierarchyItemsKeys]);

	return SubActivityComponent ? <SubActivityComponent /> : undefined;
};

export default SubActivity;
