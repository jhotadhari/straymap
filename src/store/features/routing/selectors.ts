/**
 * Internal dependencies
 */
// import { sortArrayByOrderArray } from '../../../lib/utilsLight';
// import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';
// import { RoutingSegment } from './types';

export const selectInitialized = (state: RootState) => state.routing.initialized;

export const selectIsRouting = (state: RootState) => state.routing.isRouting;

export const selectSegments = (state: RootState) => state.routing.segments;

export const selectMarkerLayerUuid = (state: RootState) => state.routing.markerLayerUuid;

export const selectPathLayerUuids = (state: RootState) => state.routing.pathLayerUuids;

export const selectMovingPointIdx = (state: RootState) => state.routing.movingPointIdx;

export const selectTriggeredMarkerIdx = (state: RootState) => state.routing.triggeredMarkerIdx;

export const selectTriggeredSegment = (state: RootState) => state.routing.triggeredSegment;

export const selectStats = (state: RootState) => state.routing.stats;

// export const selectPointIds = createAppSelector(
// 	(state: RootState) => state.routing.points,
// 	(points) => [...points].map((point) => point.id)
// );

// export const selectSegmentsArr = createAppSelector(
// 	(state: RootState) => selectPointIds(state),
// 	(state: RootState) => state.routing.segments,
// 	(pointsIds, segments) => {
// 		return sortArrayByOrderArray(
// 			Object.values(segments),
// 			pointsIds,
// 			'fromId'
// 		) as RoutingSegment[];
// 	}
// );
