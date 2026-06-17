/**
 * External dependencies
 */
import { useContext, useCallback } from 'react';
import { uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../../components/LinesTable/Context';

const useAddToMap = () => {
	const { checkedIds, setOnMapIdsTemp } = useContext(FooterContext);

	const cb = useCallback(() => {
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...checkedIds]);
			});
	}, [checkedIds, setOnMapIdsTemp]);

	return {
		key: 'addToMap',
		cb,
		label: 'addToMap',
		leadingIcon: 'map-plus',
	};
};

export default useAddToMap;
