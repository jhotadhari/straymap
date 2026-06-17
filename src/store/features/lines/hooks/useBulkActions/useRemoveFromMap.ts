import { useContext, useCallback } from 'react';
import { without } from 'lodash-es';

import { FooterContext } from '../../components/LinesTable/Context';

const useRemoveFromMap = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId } = useContext(FooterContext);

	const cb = useCallback(() => {
		const idsToRemove = routingLineId ? without(checkedIds, routingLineId) : checkedIds;
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return without(ids, ...idsToRemove);
			});
	}, [
		checkedIds,
		setOnMapIdsTemp,
		routingLineId,
	]);

	return {
		key: 'removeFromMap',
		cb,
		label: 'removeFromMap',
		leadingIcon: 'map-minus',
	};
};

export default useRemoveFromMap;
