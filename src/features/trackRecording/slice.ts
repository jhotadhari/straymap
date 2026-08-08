/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { AppThunk } from '../../store/store';
import { createLines } from '../lines/db/actionsLine';
import { createTrack } from './db/actionsTrack';
import { setLineSelected } from '../lines/slice';
import {
	selectIsRecording,
	selectMinDistance,
	selectMinTime,
	selectMinPrecision,
} from './selectors';
// import NativeTrackingModule from '../../specs/NativeTrackingModule';

export interface TrackRecordingSettings {
	isRecording: boolean;
	activeTrackId: number | null;
	activeLineId: number | null;
	minDistance: number;
	minTime: number;
	minPrecision: number;
	recordingStartTime: number | null;
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
	recordingStartTime: null,
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
		/**
		 * Passthrough — no state change.  The connectStorage listener
		 * watches this action to write the native-filtered GNSS position
		 * (with altitude resolved) to the DB.
		 */
		writeGnssPosition: (
			_state,
			_action: PayloadAction<{
				lng: number;
				lat: number;
				altitude: number | null;
			}>
		) => {
			// Passthrough for listener middleware.
		},
		setRecordingStartTime: (state, action: PayloadAction<number | null>) => {
			state.recordingStartTime = action.payload;
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
	setRecordingStartTime,
	writeGnssPosition,
} = trackRecordingSlice.actions;

export default trackRecordingSlice.reducer;

/**
 * Start recording a new track. Creates a line with a single point, creates a
 * track record, and starts the foreground service.
 *
 * Guards against re-entry: if already recording, returns immediately.
 */
export const startRecording =
	(currentPosition: { lng: number; lat: number; z?: number }): AppThunk =>
	async (dispatch, getState) => {
		// Guard: don't start a second recording
		if (selectIsRecording(getState())) {
			return;
		}

		// Capture current settings for the track snapshot
		const settings = {
			minDistance: selectMinDistance(getState()),
			minTime: selectMinTime(getState()),
			minPrecision: selectMinPrecision(getState()),
		};

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
			settings,
		});

		if (!trackResult?.id) {
			// Clean up the orphaned line — createTrack failed after createLines
			// committed.  TODO: add deleteLine call once a non-throwing version
			// is available (currently wrapped in withDbErrorHandling).
			return;
		}

		const trackId = trackResult.id;
		const now = Date.now();

		dispatch(setIsRecordingAction(true));
		dispatch(setActiveTrackId(trackId));
		dispatch(setActiveLineId(lineId));
		dispatch(setRecordingStartTime(now));
		dispatch(setLastWrittenPosition([currentPosition.lng, currentPosition.lat]));
		dispatch(setLastWrittenTime(now));

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
 * Clears activeLineId so consumers stop rendering the recording line.
 */
export const stopRecording = (): AppThunk => async (dispatch) => {
	dispatch(setIsRecordingAction(false));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	dispatch(setRecordingStartTime(null));

	// try {
	// 	await NativeTrackingModule.stopService();
	// } catch (_e) {
	// 	// Non-fatal
	// }
};
