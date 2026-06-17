/**
 * External dependencies
 */
import { useContext, useCallback } from 'react';
import { without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { useAppDispatch } from '../../../../../hooks';
import { setIsRouting } from '../../../../routing/slice';

const useRemoveFromMap = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId } = useContext(FooterContext);

	const dispatch = useAppDispatch();

	const cb = useCallback(() => {
		// const idsToRemove = routingLineId ? without(checkedIds, routingLineId) : checkedIds;
		if (routingLineId && checkedIds.includes(routingLineId)) {
			dispatch(setIsRouting(false));
		}
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return without(ids, ...checkedIds);
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
