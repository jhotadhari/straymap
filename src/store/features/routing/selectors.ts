/**
 * Internal dependencies
 */
// import { sortArrayByOrderArray } from '../../../lib/utilsLight';
// import createAppSelector from '../../createAppSelector';
import { get } from 'lodash-es';
import { RootState } from '../../store';
// import { RoutingSegment } from './types';

export const selectInitialized = (state: RootState) => state.routing.initialized;

export const selectIsRouting = (state: RootState) => state.routing.isRouting;

export const selectRoutingLineId = (state: RootState) => state.routing.routingLineId;

export const selectSegments = (state: RootState) => state.routing.segments;

export const selectSegmentByRecordId = (state: RootState, segmentRecordId: string ) => {
    return get(state.routing.segments, segmentRecordId );
};

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
