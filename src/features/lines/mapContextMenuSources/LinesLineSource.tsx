/**
 * External dependencies
 */
import { FC, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bbox as turfBbox } from '@turf/turf';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppDispatch } from '../../../store/hooks';
import { setLineTemp, setLineSelected } from '../slice';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { lineIdByPathUuid } from '../layerRegistry';
import { useSystemLineIds } from '../../../store/hooks';
import { AppContext } from '../../../Context';
import { MAP_ANIMATION_PADDING_PX } from '../../../constants';

/**
 * Short-press source for a selected line (LayerPath hit): edit the line,
 * fly to it, or remove it from the map (disabled for system lines such as
 * the routing or track-recording lines).
 */
const LinesLineSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const { mapViewNativeNodeHandle, drawerControlsRef } = useContext(AppContext);
	const { flyToBounds } = useMap(mapViewNativeNodeHandle);
	const systemLineIds = useSystemLineIds();

	const lineId = useMemo(() => {
		if (context.press !== 'short') {
			return null;
		}
		const pathHit = context.hits.find((hit) => hit?.manager === 'paths');
		return pathHit ? lineIdByPathUuid(pathHit.uuid) : null;
	}, [context]);

	const { data: lines } = useQuery({
		queryKey: ['lines', lineId != null ? [lineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: lineId != null,
	});
	const line = lines?.length ? lines[0] : undefined;

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (lineId == null) {
			return null;
		}
		return [
			{
				key: 'editLine',
				label: 'lines.editLine',
				leadingIcon: 'pencil-outline',
				cb: () => {
					dispatch(setLineTemp({ id: lineId }));
				},
			},
			{
				key: 'flyTo',
				label: 'lines.flyTo',
				leadingIcon: 'image-filter-center-focus-strong-outline',
				cb: () => {
					if (line?.envelope) {
						flyToBounds(turfBbox(line.envelope), {
							paddingPx: MAP_ANIMATION_PADDING_PX,
						});
						drawerControlsRef.current?.left.expand(false);
						drawerControlsRef.current?.right.expand(false);
					}
				},
				disabled: () => !line?.envelope,
			},
			{
				key: 'removeFromMap',
				label: 'lines.removeFromMap',
				leadingIcon: 'map-minus',
				cb: () => dispatch(setLineSelected(lineId, false)),
				disabled: () => Object.values(systemLineIds).includes(lineId),
			},
		];
	}, [
		dispatch,
		drawerControlsRef,
		flyToBounds,
		line?.envelope,
		lineId,
		systemLineIds,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default LinesLineSource;
