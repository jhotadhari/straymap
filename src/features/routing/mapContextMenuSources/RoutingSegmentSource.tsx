/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppSelector } from '../../../store/hooks';
import { selectIsRouting, selectMovedPointId } from '../selectors';
import { segmentRecordIdByUuid } from '../layerRegistry';
import { getNearestPointHitAtTap } from '../utils';
import useRoute from '../hooks/useRoute';
import usePointActions from '../hooks/usePointActions';

/**
 * Long-press source for a routing segment (ramp or fallback path hit
 * while routing is active and no point is being moved): cuts the segment
 * at the pressed position — the new waypoint immediately enters move mode.
 */
const RoutingSegmentSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const movedPointId = useAppSelector(selectMovedPointId);
	const isRouting = useAppSelector(selectIsRouting);
	const { points, id: routeId } = useRoute(['id', 'points']) || {};

	const { cutSegmentAt } = usePointActions({ routeId, points });

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (context.press !== 'long' || movedPointId || !isRouting || !points?.length) {
			return null;
		}
		// Ramp segments live in the ext's "paths_colorramp" manager; the
		// blue fallback segments use the core "paths" manager and are
		// disambiguated from lines via the routing layer registry.
		const segmentHit = context.hits.find(
			(hit) =>
				hit?.manager === 'paths_colorramp' ||
				(hit?.manager === 'paths' && segmentRecordIdByUuid(hit.uuid) !== null)
		);
		if (!segmentHit) {
			return null;
		}
		// Cutting doesn't make sense when the tap is on an existing
		// waypoint — keep the entry but disable it so both groups render.
		// Screen-distance (dp) based so it holds at any zoom level.
		const tapHitsMarker = points ? !!getNearestPointHitAtTap(points, context) : false;
		const segmentRecordId = segmentRecordIdByUuid(segmentHit.uuid);
		if (!segmentRecordId || !segmentHit.nearestPoint) {
			return null;
		}
		const [fromIdStr, toIdStr] = segmentRecordId.split('_');
		const fromIndex = points.findIndex((p) => p.id === parseInt(fromIdStr, 10));
		const toIndex = points.findIndex((p) => p.id === parseInt(toIdStr, 10));
		if (fromIndex === -1 || toIndex !== fromIndex + 1) {
			return null;
		}
		const nearest: [number, number] = [
			segmentHit.nearestPoint[0],
			segmentHit.nearestPoint[1],
		];
		return [
			{
				key: 'cutSegment',
				label: 'routing.cutSegment',
				leadingIcon: 'content-cut',
				cb: () => cutSegmentAt(segmentRecordId, nearest, toIndex),
				disabled: () => tapHitsMarker,
			},
		];
	}, [
		context,
		cutSegmentAt,
		isRouting,
		movedPointId,
		points,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default RoutingSegmentSource;
