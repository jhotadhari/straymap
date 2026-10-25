/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { openSharePosition } from '../controller';

/**
 * Long-press source for the general map menu (feature-less map, but also
 * shown when long-pressing on features — the hits are in the context for
 * future feature-specific long-press menus).
 *
 * Actions today: Share position (opens a mock modal). Future: add waypoint,
 * start measuring distance, …
 */
const MapGeneralSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const options = useMemo<MenuActionOption[]>(() => {
		if (context.press !== 'long') {
			return [];
		}
		return [
			{
				key: 'sharePosition',
				label: 'mapContextMenu.sharePosition',
				leadingIcon: 'share-variant-outline',
				cb: () => {
					openSharePosition(context.lng, context.lat, context.zoomLevel);
				},
			},
		];
	}, [context]);

	useEffect(() => {
		onOptions(options.length ? options : null);
	}, [onOptions, options]);

	return null;
};

export default MapGeneralSource;
