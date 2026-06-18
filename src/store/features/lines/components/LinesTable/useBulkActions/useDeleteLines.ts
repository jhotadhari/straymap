/**
 * External dependencies
 */
import { useContext, useCallback } from 'react';
import { uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useDeleteLinesCbModal from '../../../hooks/useDeleteLinesCbModal';

const useDeleteLines = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId, routeId, setCheckedIds } =
		useContext(FooterContext);

	const removeLinesFromMap = useCallback(() => {
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...checkedIds]);
			});
	}, [setOnMapIdsTemp, checkedIds]);

	const onSuccess = useCallback(() => {
		// Uncheck lines.
		setCheckedIds && setCheckedIds([]);
	}, [setCheckedIds]);

	const { cb, modalNode, iconSource } = useDeleteLinesCbModal({
		deleteIdsOrId: checkedIds,
		routeId,
		routingLineId,
		removeLinesFromMap,
		onSuccess,
	});

	return {
		key: 'deleteLines',
		cb,
		label: 'deleteLines',
		leadingIcon: iconSource,
		modalNode,
	};
};

export default useDeleteLines;
