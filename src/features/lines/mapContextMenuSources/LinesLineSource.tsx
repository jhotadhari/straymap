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
import { useAppDispatch, useAppSelector, useLineColorRamps } from '../../../store/hooks';
import { setLineTemp, setLineSelected } from '../slice';
import { selectLineColor } from '../selectors';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { lineIdByPathUuid } from '../layerRegistry';
import { useSystemLineIds } from '../../../store/hooks';
import { continueRecording } from '../../trackRecording/slice';
import { selectPausedLineId, selectIsRecording } from '../../trackRecording/selectors';
import ensureLocationPermission from '../../../lib/locationPermission';
import ensureNotificationPermission from '../../../lib/notificationPermission';
import useActivateDrawerItem from '../../drawers/hooks/useActivateDrawerItem';
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
	const activateTrackingDrawerItem = useActivateDrawerItem('tracking');
	const isRecording = useAppSelector(selectIsRecording);
	const pausedLineId = useAppSelector(selectPausedLineId);

	const lineId = useMemo(() => {
		if (context.press !== 'long') {
			return null;
		}
		// Ramp-rendered lines report under the ext's "paths_colorramp"
		// manager; solid lines under the core "paths" manager. Both
		// register their uuids in linesLayerRegistry — the lookup also
		// disambiguates routing segments (routing registry, not lines).
		const pathHit = context.hits.find(
			(hit) =>
				(hit?.manager === 'paths' || hit?.manager === 'paths_colorramp') &&
				lineIdByPathUuid(hit.uuid) !== null
		);
		return pathHit ? lineIdByPathUuid(pathHit.uuid) : null;
	}, [context]);

	const { data: lines } = useQuery({
		queryKey: ['lines', lineId != null ? [lineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: lineId != null,
	});
	const line = lines?.length ? lines[0] : undefined;

	const lineColor = useAppSelector(selectLineColor(lineId ?? -1));
	const lineColorRamps = useLineColorRamps();
	const isSystemLine = useMemo(
		() => lineId != null && Object.values(systemLineIds).includes(lineId),
		[lineId, systemLineIds]
	);
	const hasRecordedTag = useMemo(
		() => (line?.tags ?? []).some((tag) => tag.label === 'recorded'),
		[line?.tags]
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
			...(hasRecordedTag
				? [
						{
							key: 'continueRecording',
							label: 'trackRecording.continueRecording',
							leadingIcon: 'record-rec',
							cb: async () => {
								const granted = await ensureLocationPermission();
								if (!granted) {
									return;
								}
								await ensureNotificationPermission();
								dispatch(continueRecording(lineId));
								activateTrackingDrawerItem();
							},
							disabled: () => isRecording,
						} as MenuActionOption,
					]
				: []),
			{
				key: 'changeColor',
				label: 'lines.changeColor',
				leadingIcon: 'palette-outline',
				cb: () => {
					openLineColorPicker(lineId, lineColor ?? PALETTE_COLORS[0].bg, {
						rampActive: lineColorRamps[lineId] != null,
						rampEnabled: line?.stats?.minZ != null,
					});
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
				// System lines can't be removed — except the paused
				// recording line: removing it releases the paused
				// recording mode.
				disabled: () => isSystemLine && pausedLineId !== lineId,
			},
		];
	}, [
		dispatch,
		drawerControlsRef,
		flyToBounds,
		line?.envelope,
		line?.stats?.minZ,
		lineColor,
		lineColorRamps,
		lineId,
		isSystemLine,
		pausedLineId,
		hasRecordedTag,
		isRecording,
		activateTrackingDrawerItem,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default LinesLineSource;
