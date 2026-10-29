/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { openSharePosition } from '../controller';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectMeasureActive } from '../../measure/selectors';
import { clearMeasurement, startMeasurement } from '../../measure/slice';

/**
 * Long-press source for the general map menu (feature-less map, but also
 * shown when long-pressing on features — the hits are in the context for
 * future feature-specific long-press menus).
 *
 * Actions: Measure distance / Remove measurement, Share position.
 * Future: add waypoint, …
 */
const MapGeneralSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const measureActive = useAppSelector(selectMeasureActive);

	const options = useMemo<MenuActionOption[]>(() => {
		if (context.press !== 'long') {
			return [];
		}
		return [
			measureActive
				? {
						key: 'stopMeasurement',
						label: 'measure.stopMeasurement',
						leadingIcon: 'ruler-square',
						cb: () => {
							dispatch(clearMeasurement());
						},
					}
				: {
						key: 'measureDistance',
						label: 'measure.measureDistance',
						leadingIcon: 'ruler-square',
						cb: () => {
							dispatch(startMeasurement({ lng: context.lng, lat: context.lat }));
						},
					},
			{
				key: 'sharePosition',
				label: 'mapContextMenu.sharePosition',
				leadingIcon: 'share-variant-outline',
				cb: () => {
					openSharePosition(context.lng, context.lat, context.zoomLevel);
				},
			},
		];
	}, [
		context,
		dispatch,
		measureActive,
	]);

	useEffect(() => {
		onOptions(options.length ? options : null);
	}, [onOptions, options]);

	return null;
};

export default MapGeneralSource;
