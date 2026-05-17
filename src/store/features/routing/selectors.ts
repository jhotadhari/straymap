/**
 * Internal dependencies
 */
import { getUpDown } from '../../../lib/utils';
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.routing.initialized;

export const selectIsRouting = (state: RootState) => state.routing.isRouting;

export const selectPoints = (state: RootState) => state.routing.points;

export const selectSegments = (state: RootState) => state.routing.segments;

export const selectMarkerLayerUuid = (state: RootState) => state.routing.markerLayerUuid;

export const selectPathLayerUuids = (state: RootState) => state.routing.pathLayerUuids;

export const selectMovingPointIdx = (state: RootState) => state.routing.movingPointIdx;

export const selectTriggeredMarkerIdx = (state: RootState) => state.routing.triggeredMarkerIdx;

export const selectTriggeredSegment = (state: RootState) => state.routing.triggeredSegment;

export const selectSavedExported = (state: RootState) => state.routing.savedExported;

export const selectStats = createAppSelector(
	(state: RootState) => state.routing.segments,
	// (state: RootState) => state.drawers.itemKeysRight,
	// (_state: RootState, { side }: { side: string }) => side,
	(segments) => {
		if (!segments.length) {
			return {
				up: 0,
				down: 0,
				distance: 0,
			};
		}
		[...segments].reduce(
			(acc, segment) => {
				const { up, down } = getUpDown(segment?.coordinatesSimplified);

				return {
					up: acc.up + up,
					down: acc.down + down,
					distance:
						acc.distance +
						(segment?.coordinatesSimplified
							? segment.coordinatesSimplified[
									segment.coordinatesSimplified.length - 1
								].distance || 0
							: 0),
				};
			},
			{
				up: 0,
				down: 0,
				distance: 0,
			}
		);
	}
);
