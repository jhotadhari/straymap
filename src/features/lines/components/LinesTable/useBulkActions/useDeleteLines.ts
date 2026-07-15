/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';
import { uniq, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectSelected } from '../../../selectors';
import { setLinesSelected } from '../../../slice';
import useDeleteLinesCbModal from '../../../hooks/useDeleteLinesCbModal';

const useDeleteLines = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId, routeId, setCheckedIds } =
		useContext(FooterContext);

	const dispatch = useAppDispatch();

	const selectedIds = useAppSelector(selectSelected);

	// Exclude the routing line from bulk deletion — deleting the
	// line that is currently being routed would orphan the active
	// route and break the map display.
	const deleteIds = useMemo(
		() => (routingLineId ? without(checkedIds, routingLineId) : checkedIds),
		[checkedIds, routingLineId]
	);

	const removeLinesFromMap = useCallback(() => {
		setOnMapIdsTemp &&
			setOnMapIdsTemp((ids) => {
				return uniq([...ids, ...deleteIds]);
			});
	}, [setOnMapIdsTemp, deleteIds]);

	const onSuccess = useCallback(() => {
		// Uncheck lines in the table.
		setCheckedIds && setCheckedIds([]);
		// Remove deleted IDs from local onMapIdsTemp so the
		// LinesTable unmount cleanup doesn't re-populate Redux
		// with stale IDs.
		setOnMapIdsTemp && setOnMapIdsTemp((ids) => without(ids, ...deleteIds));
		// Remove deleted line IDs from Redux so the map and
		// DrawerTopBar update immediately.
		dispatch(setLinesSelected(without(selectedIds, ...deleteIds)));
	}, [
		setCheckedIds,
		setOnMapIdsTemp,
		dispatch,
		selectedIds,
		deleteIds,
	]);

	const disabled = useCallback(() => deleteIds.length === 0, [deleteIds]);

	const { cb, modalNode, iconSource } = useDeleteLinesCbModal({
		deleteIdsOrId: deleteIds,
		routeId,
		routingLineId,
		removeLinesFromMap,
		onSuccess,
	});

	return useMemo(
		() => ({
			key: 'deleteLines',
			cb,
			label: 'lines.deleteLines',
			leadingIcon: iconSource,
			modalNode,
			disabled,
		}),
		[
			cb,
			iconSource,
			modalNode,
			disabled,
		]
	);
};

export default useDeleteLines;
