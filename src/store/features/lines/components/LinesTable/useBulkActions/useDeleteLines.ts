/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';
import { uniq, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectSelectedInfos } from '../../../selectors';
import { setLinesSelected } from '../../../slice';
import useDeleteLinesCbModal from '../../../hooks/useDeleteLinesCbModal';

const useDeleteLines = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId, routeId, setCheckedIds } =
		useContext(FooterContext);

	const dispatch = useAppDispatch();

	const { selectedIds } = useAppSelector(selectSelectedInfos);

	const removeLinesFromMap = useCallback(() => {
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...checkedIds]);
			});
	}, [setOnMapIdsTemp, checkedIds]);

	const onSuccess = useCallback(() => {
		// Uncheck lines in the table.
		setCheckedIds && setCheckedIds([]);
		// Remove deleted line IDs from Redux so the map and
		// DrawerTopBar update immediately (instead of waiting
		// for the LinesTable unmount cleanup effect).
		dispatch(setLinesSelected(without(selectedIds, ...checkedIds)));
	}, [setCheckedIds, dispatch, selectedIds, checkedIds]);

	const { cb, modalNode, iconSource } = useDeleteLinesCbModal({
		deleteIdsOrId: checkedIds,
		routeId,
		routingLineId,
		removeLinesFromMap,
		onSuccess,
	});

	return useMemo(
		() => ({
			key: 'deleteLines',
			cb,
			label: 'deleteLines',
			leadingIcon: iconSource,
			modalNode,
		}),
		[cb, iconSource, modalNode]
	);
};

export default useDeleteLines;
