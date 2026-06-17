import { useContext, useCallback } from 'react';
import { uniq } from 'lodash-es';

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
