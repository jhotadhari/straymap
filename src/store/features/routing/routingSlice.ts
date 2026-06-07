/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { RoutingPoint, RoutingSegment, RoutingTriggeredSegment } from './types';
import { getSetterThunkWithGetter } from '../baseMap/utils';
import { selectPoints, selectSavedExported } from './selectors';
import { AppThunk } from '../../store';
import { filterSegments } from './utils';

export interface RoutingSettings {
	isRouting: false | number;	// false or routeId.
}

export interface RoutingState extends SliceSettingsBase, RoutingSettings {
	points: RoutingPoint[];
	segments: RoutingSegment[];
	markerLayerUuid: null | string;
	pathLayerUuids: null | string[];
	movingPointIdx?: number;
	triggeredMarkerIdx?: number;
	triggeredSegment?: RoutingTriggeredSegment;
	savedExported: {
		saved: boolean;
		exported: boolean;
	};
}

export const initialSettings: RoutingSettings = {
	isRouting: false,
};

const initialState: RoutingState = {
	initialized: false,
	markerLayerUuid: null,
	pathLayerUuids: null,
	savedExported: {
		saved: false,
		exported: false,
	},
	points: [],
	segments: [],
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const routingSlice = createSlice({
	name: 'routing',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setIsRouting: (state, action: PayloadAction<RoutingState['isRouting']>) => {
			state.isRouting = action.payload;
			if (!action.payload) {
				state.segments = [];
				state.points = [];
				state.movingPointIdx = undefined;
			} else {
				state.savedExported = initialState.savedExported;
			}
		},

		setPoints: (state, action: PayloadAction<{
			points: RoutingState['points'],
			updateLine: boolean;
		}>) => {
			state.points = action.payload.points;

			// state.isRouting;

			state.savedExported = initialState.savedExported;
		},
		setSegments: (
			state,
			action: PayloadAction<{
				segments: RoutingState['segments'];
				updateRoutes: boolean;
				updateLine: boolean;
			}>
		) => {
			state.segments = action.payload.segments;
			state.savedExported = initialState.savedExported;
		},
		setMarkerLayerUuid: (state, action: PayloadAction<RoutingState['markerLayerUuid']>) => {
			state.markerLayerUuid = action.payload;
		},
		setPathLayerUuids: (state, action: PayloadAction<RoutingState['pathLayerUuids']>) => {
			state.pathLayerUuids = action.payload;
		},

		setMovingPointIdx: (state, action: PayloadAction<RoutingState['movingPointIdx']>) => {
			state.movingPointIdx = action.payload;
		},
		setTriggeredMarkerIdx: (
			state,
			action: PayloadAction<RoutingState['triggeredMarkerIdx']>
		) => {
			state.triggeredMarkerIdx = action.payload;
		},
		setTriggeredSegment: (state, action: PayloadAction<RoutingState['triggeredSegment']>) => {
			state.triggeredSegment = action.payload;
		},
		setSavedExported: (state, action: PayloadAction<RoutingState['savedExported']>) => {
			state.savedExported = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setIsRouting,
	setPoints: setPointsAction,
	setSegments: setSegmentsAction,

	setMarkerLayerUuid,
	setPathLayerUuids,
	setMovingPointIdx,
	setTriggeredMarkerIdx,
	setTriggeredSegment,
	setSavedExported: setSavedExportedAction,
} = routingSlice.actions;

// Export the slice reducer for use in the store configuration
export default routingSlice.reducer;

export const setSavedExported = getSetterThunkWithGetter<RoutingState['savedExported']>(
	selectSavedExported,
	routingSlice.actions.setSavedExported
);

export const setSegments = (
	segments: RoutingSegment[],
	options?: {
		filter?: boolean;
		updateRoutes?: boolean;
		updateLine?: boolean;	// defaults to true.
	}
): AppThunk => {
	return (dispatch, getState) => {
		if (options?.filter) {
			dispatch(
				routingSlice.actions.setSegments({
					segments: filterSegments(segments, selectPoints(getState())),
					updateRoutes: !!options?.updateRoutes,
					updateLine: false !== options?.updateLine,
				})
			);
		} else {
			dispatch(
				routingSlice.actions.setSegments({
					segments,
					updateRoutes: !!options?.updateRoutes,
					updateLine: false !== options?.updateLine,
				})
			);
		}
	};
};

export const setPoints = (
	points: RoutingPoint[],
	options?: {
		updateLine?: boolean;	// defaults to true.
	}
): AppThunk => {
	return (dispatch, getState) => {
			dispatch(
				routingSlice.actions.setPoints({
					points,
					updateLine: false !== options?.updateLine,
				})
			);
	};
};
