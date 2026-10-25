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
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setLineTemp, setLineSelected } from '../slice';
import { selectLineColor } from '../selectors';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { lineIdByPathUuid } from '../layerRegistry';
import { useSystemLineIds } from '../../../store/hooks';
import { AppContext } from '../../../Context';
import { MAP_ANIMATION_PADDING_PX, PALETTE_COLORS } from '../../../constants';
import IconCustom from '../../../components/generic/primitives/IconCustom';
import { openLineColorPicker } from './lineColorPickerStore';

/**
 * Long-press source for a selected line (LayerPath hit): route details,
 * fly to it, change its color, or remove it from the map. System lines
 * (routing, track-recording, …) get the color/remove actions disabled —
 * they use the colored path layer instead of per-line colors.
 */
const LinesLineSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const { mapViewNativeNodeHandle, drawerControlsRef } = useContext(AppContext);
	const { flyToBounds } = useMap(mapViewNativeNodeHandle);
	const systemLineIds = useSystemLineIds();

	const lineId = useMemo(() => {
		if (context.press !== 'long') {
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

	const lineColor = useAppSelector(selectLineColor(lineId ?? -1));
	const isSystemLine = useMemo(
		() => lineId != null && Object.values(systemLineIds).includes(lineId),
		[lineId, systemLineIds]
	);

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (lineId == null) {
			return null;
		}
		return [
			{
				key: 'routeDetails',
				label: 'lines.routeDetails',
				IconComponent: ({ color, size }) => (
					<IconCustom
						name="route_cog"
						color={color}
						size={size}
					/>
				),
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
				key: 'changeColor',
				label: 'lines.changeColor',
				leadingIcon: 'palette-outline',
				cb: () => {
					openLineColorPicker(lineId, lineColor ?? PALETTE_COLORS[0].bg);
				},
				disabled: () => isSystemLine,
			},
			{
				key: 'removeFromMap',
				label: 'lines.removeFromMap',
				leadingIcon: 'map-minus',
				cb: () => {
					dispatch(setLineSelected(lineId, false));
				},
				disabled: () => isSystemLine,
			},
		];
	}, [
		dispatch,
		drawerControlsRef,
		flyToBounds,
		line?.envelope,
		lineColor,
		lineId,
		isSystemLine,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default LinesLineSource;
