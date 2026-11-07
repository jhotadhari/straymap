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
import { selectActiveLineId } from '../../../../trackRecording/selectors';
import useDeleteLinesCbModal from '../../../hooks/useDeleteLinesCbModal';

const useDeleteLines = () => {
	const { checkedIds, setOnMapIdsTemp, routingLineId, routeId, setCheckedIds } =
		useContext(FooterContext);

	const dispatch = useAppDispatch();

	const selectedIds = useAppSelector(selectSelected);
	const activeLineId = useAppSelector(selectActiveLineId);

	// Exclude the routing line and the actively recording line from
	// bulk deletion — deleting the line that is currently being routed
	// would orphan the active route, and deleting the line a recording
	// session is appending to would break the recording. The paused
	// recording line (activeLineId is null after a stop) stays
	// deletable — deleting it releases the paused recording mode.
	const deleteIds = useMemo(() => {
		const excluded: number[] = [];
		if (routingLineId) {
			excluded.push(routingLineId);
		}
		if (activeLineId != null) {
			excluded.push(activeLineId);
		}
		return excluded.length ? without(checkedIds, ...excluded) : checkedIds;
	}, [
		checkedIds,
		routingLineId,
		activeLineId,
	]);

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
