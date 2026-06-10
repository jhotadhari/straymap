/**
 * Internal dependencies
 */
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
