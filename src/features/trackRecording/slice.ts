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
import { selectIsRecording } from './selectors';
import { logError } from '../../lib/utils';
import NativeTrackingModule from '../../specs/NativeTrackingModule';
import { setIsActive } from '../gnss/slice';

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
	lastWrittenPosition?: [
		number,
		number,
		number?,
	];
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
		setLastWrittenPosition: (
			state,
			action: PayloadAction<
				| [
						number,
						number,
						number?,
				  ]
				| undefined
			>
		) => {
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
 * Start recording a new track: switches GNSS on and starts the
 * foreground service. The track's line is created lazily by the
 * writeGnssPosition listener once two native positions exist — a
 * single-point LineString is invalid GeoJSON and SpatiaLite's
 * GeomFromGeoJSON rejects it (NOT NULL constraint on lines.geometry).
 *
 * Guards against re-entry: if already recording, returns immediately.
 */
export const startRecording = (): AppThunk => async (dispatch, getState) => {
	// Guard: don't start a second recording
	if (selectIsRecording(getState())) {
		return;
	}

	// Recording requires GNSS — switch it on. One-way: stopping the
	// recording leaves GNSS toggling to the user.
	dispatch(setIsActive(true));

	const now = Date.now();

	dispatch(setIsRecordingAction(true));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	dispatch(setRecordingStartTime(now));

	// Start the foreground service — keeps the recording notification
	// alive while the app is backgrounded. Non-fatal on failure.
	try {
		await NativeTrackingModule.startService();
	} catch (err) {
		logError('trackRecording/startRecording.startService', err);
	}
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

	// Stop the foreground service. Non-fatal on failure.
	try {
		await NativeTrackingModule.stopService();
	} catch (err) {
		logError('trackRecording/stopRecording.stopService', err);
	}
};
