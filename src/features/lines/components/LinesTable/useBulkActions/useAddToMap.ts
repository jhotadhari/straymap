/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';
import { uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';

const useAddToMap = () => {
	const { checkedIds, setOnMapIdsTemp } = useContext(FooterContext);

	const cb = useCallback(() => {
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...checkedIds]);
			});
	}, [checkedIds, setOnMapIdsTemp]);

	return useMemo(
		() => ({
			key: 'addToMap',
			cb,
			label: 'lines.addToMap',
			leadingIcon: 'map-plus',
		}),
		[cb]
	);
};

export default useAddToMap;
