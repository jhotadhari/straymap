/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { AppThunk } from '../../store';
import { createLines } from '../lines/db/actionsLine';
import { createTrack } from './db/actionsTrack';
import { setLineSelected } from '../lines/slice';
// import NativeTrackingModule from '../../../specs/NativeTrackingModule';

export interface TrackRecordingSettings {
	isRecording: boolean;
	activeTrackId: number | null;
	activeLineId: number | null;
	minDistance: number;
	minTime: number;
	minPrecision: number;
}

export interface TrackRecordingState extends SliceSettingsBase, TrackRecordingSettings {
	lastWrittenPosition?: [number, number];
	lastWrittenTime?: number;
}

export const initialSettings: TrackRecordingSettings = {
	isRecording: false,
	activeTrackId: null,
	activeLineId: null,
	minDistance: 5,
	minTime: 2,
	minPrecision: 20,
};

const initialState: TrackRecordingState = {
	initialized: false,
	...initialSettings,
};

export const trackRecordingSlice = createSlice({
	name: 'trackRecording',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setIsRecording: (state, action: PayloadAction<boolean>) => {
			state.isRecording = action.payload;
			if (!action.payload) {
				state.lastWrittenPosition = undefined;
				state.lastWrittenTime = undefined;
			}
		},
		setActiveTrackId: (state, action: PayloadAction<number | null>) => {
			state.activeTrackId = action.payload;
		},
		setActiveLineId: (state, action: PayloadAction<number | null>) => {
			state.activeLineId = action.payload;
		},
		setMinDistance: (state, action: PayloadAction<number>) => {
			state.minDistance = action.payload;
		},
		setMinTime: (state, action: PayloadAction<number>) => {
			state.minTime = action.payload;
		},
		setMinPrecision: (state, action: PayloadAction<number>) => {
			state.minPrecision = action.payload;
		},
		setLastWrittenPosition: (state, action: PayloadAction<[number, number] | undefined>) => {
			state.lastWrittenPosition = action.payload;
		},
		setLastWrittenTime: (state, action: PayloadAction<number | undefined>) => {
			state.lastWrittenTime = action.payload;
		},
	},
});

export const {
	setInitialized,
	setIsRecording: setIsRecordingAction,
	setActiveTrackId,
	setActiveLineId,
	setMinDistance,
	setMinTime,
	setMinPrecision,
	setLastWrittenPosition,
	setLastWrittenTime,
} = trackRecordingSlice.actions;

export default trackRecordingSlice.reducer;

// Exported for connectStorage
export const onSetDbPath = undefined;

/**
 * Start recording a new track. Creates a line with a single point, creates a
 * track record, and starts the foreground service.
 */
export const startRecording =
	(currentPosition: { lng: number; lat: number; z?: number }): AppThunk =>
	async (dispatch) => {
		// Create a line with initial point
		const coord: number[] = [currentPosition.lng, currentPosition.lat];
		if (currentPosition.z !== undefined) {
			coord[2] = currentPosition.z;
		}

		const result = await createLines([
			{
				title: null,
				lineStringFeature: {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: [coord],
					},
				},
			},
		]);

		if (!result?.length) {
			return;
		}

		const lineId = result[0].id;

		// Create a track record linked to the line
		const trackResult = await createTrack({
			line_id: lineId,
			settings: {
				// Settings will be read from state at start time
			},
		});

		if (!trackResult?.id) {
			return;
		}

		const trackId = trackResult.id;

		dispatch(setIsRecordingAction(true));
		dispatch(setActiveTrackId(trackId));
		dispatch(setActiveLineId(lineId));

		// Auto-select the line so it appears in the drawer list
		dispatch(setLineSelected(lineId, true));

		// Start foreground service (requires Phase 5 native module)
		// try {
		// 	await NativeTrackingModule.startService();
		// } catch (_e) {
		// 	// Service start failure is non-fatal
		// }
	};

/**
 * Stop recording. Finalizes the track and stops the foreground service.
 * The recording line stays selected on the map.
 */
export const stopRecording = (): AppThunk => async (dispatch) => {
	dispatch(setIsRecordingAction(false));
	dispatch(setActiveTrackId(null));

	// try {
	// 	await NativeTrackingModule.stopService();
	// } catch (_e) {
	// 	// Non-fatal
	// }
};
