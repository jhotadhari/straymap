/**
 * External dependencies
 */
import { FC, useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MapContextMenuSourceComponentProps, MenuActionOption } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectFollowingLineId } from '../selectors';
import { selectTrackLineId } from '../../trackRecording/selectors';
import { selectIsRouting, selectRoutingLineId } from '../../routing/selectors';
import { startFollowing, stopFollowing } from '../slice';
import { lineIdByPathUuid } from '../../lines/layerRegistry';
import { segmentRecordIdByUuid } from '../../routing/layerRegistry';

/**
 * Long-press source that contributes the follow / stop-follow action for
 * the pressed line — both regular lines (lines layer registry) and the
 * routing line (routing segment registry). A line can't be the followed
 * line and the recording line (or a parked recording) at the same time,
 * so the follow action is disabled while the pressed line is being
 * recorded or parked after a recording.
 */
const FollowLineSource: FC<MapContextMenuSourceComponentProps> = ({ context, onOptions }) => {
	const dispatch = useAppDispatch();
	const followingLineId = useAppSelector(selectFollowingLineId);
	const trackLineId = useAppSelector(selectTrackLineId);
	const isRouting = useAppSelector(selectIsRouting);
	const routingLineId = useAppSelector(selectRoutingLineId);

	const lineId = useMemo(() => {
		if (context.press !== 'long') {
			return null;
		}
		// Regular line hit (solid or ramp path registered in the lines layer registry).
		const lineHit = context.hits.find(
			(hit) =>
				(hit?.manager === 'paths' || hit?.manager === 'paths_colorramp') &&
				lineIdByPathUuid(hit.uuid) !== null
		);
		if (lineHit) {
			return lineIdByPathUuid(lineHit.uuid);
		}
		// Routing line hit (routing segments are rendered by RoutingMapView).
		if (isRouting && routingLineId != null) {
			const routingHit = context.hits.find(
				(hit) =>
					hit?.manager === 'paths_colorramp' ||
					(hit?.manager === 'paths' && segmentRecordIdByUuid(hit.uuid) !== null)
			);
			if (routingHit) {
				return routingLineId;
			}
		}
		return null;
	}, [
		context,
		isRouting,
		routingLineId,
	]);

	const isFollowing = useMemo(
		() => lineId != null && followingLineId === lineId,
		[
			lineId,
			followingLineId,
		]
	);
	const isRecordingThisLine = useMemo(
		() => lineId != null && trackLineId === lineId,
		[
			lineId,
			trackLineId,
		]
	);

	const options = useMemo<MenuActionOption[] | null>(() => {
		if (lineId == null) {
			return null;
		}
		return isFollowing
			? [
					{
						key: 'stopFollowLine',
						label: 'lineFollow.stop',
						leadingIcon: 'map-marker-path',
						cb: () => {
							dispatch(stopFollowing());
						},
					} as MenuActionOption,
				]
			: [
					{
						key: 'followLine',
						label: 'lineFollow.start',
						leadingIcon: 'map-marker-path',
						cb: () => {
							dispatch(startFollowing(lineId));
						},
						disabled: () => isRecordingThisLine,
					} as MenuActionOption,
				];
	}, [
		dispatch,
		lineId,
		isFollowing,
		isRecordingThisLine,
	]);

	useEffect(() => {
		onOptions(options);
	}, [onOptions, options]);

	return null;
};

export default FollowLineSource;
