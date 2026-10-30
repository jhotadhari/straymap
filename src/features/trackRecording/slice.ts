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
import { selectActiveLineId, selectIsRecording } from './selectors';
import { logError } from '../../lib/utils';
import { setIsActive } from '../gnss/slice';
import { setLineSelected } from '../lines/slice';
import { selectFollowingLineId } from '../lineFollow/selectors';
import { startRecordingTask, stopRecordingTask } from './backgroundTask';
import { createTrack } from './db/actionsTrack';
import { queryTrackByLineId, queryLineExists } from './db/queryFns';
import { clampLineWidth } from '../../lib/lineWidth';

/** Default recording line width (dp) — the chevron trail's band height. */
export const DEFAULT_RECORDING_LINE_WIDTH = 4;

export interface TrackRecordingSettings {
	isRecording: boolean;
	/** Recording was restored from storage and resumes on the first
	 * native GNSS position (see writeGnssPosition listener). */
	resumePending: boolean;
	/** Prefer DEM (HGT) elevation over GNSS altitude for recorded
	 * points when the tile is cached. Falls back to GNSS on miss. */
	useDemAltitude: boolean;
	activeTrackId: number | null;
	activeLineId: number | null;
	minDistance: number;
	minTime: number;
	minPrecision: number;
	recordingStartTime: number | null;
	/** Recording line width (dp), clamped. Drives the chevron size. */
	lineWidth: number;
}

export interface TrackRecordingState extends SliceSettingsBase, TrackRecordingSettings {
	lastWrittenPosition?: [
		number,
		number,
		number?,
	];
	lastWrittenTime?: number;
	/**
	 * Transient — not persisted.  Set on stopRecording to the line that
	 * was just recorded: stopping is pausing, so the last recorded line
	 * stays rendered as the recording line (on top) until it is removed
	 * from the map — re-adding it then renders it as a normal line.
	 */
	pausedLineId: number | null;
	/**
	 * Transient — not persisted.  Set on restore when the app was
	 * killed while a recording was active (or pending).  The
	 * ResumeRecordingPrompt overlay asks the user to continue or
	 * discard before anything resumes.
	 */
	resumePromptPending: boolean;
}

export const initialSettings: TrackRecordingSettings = {
	isRecording: false,
	resumePending: false,
	useDemAltitude: true,
	activeTrackId: null,
	activeLineId: null,
	minDistance: 5,
	minTime: 2,
	minPrecision: 20,
	recordingStartTime: null,
	lineWidth: DEFAULT_RECORDING_LINE_WIDTH,
};

const initialState: TrackRecordingState = {
	initialized: false,
	pausedLineId: null,
	resumePromptPending: false,
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
		setLineWidth: (state, action: PayloadAction<number>) => {
			state.lineWidth = clampLineWidth(action.payload);
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
		setResumePending: (state, action: PayloadAction<boolean>) => {
			state.resumePending = action.payload;
		},
		setResumePromptPending: (state, action: PayloadAction<boolean>) => {
			state.resumePromptPending = action.payload;
		},
		setUseDemAltitude: (state, action: PayloadAction<boolean>) => {
			state.useDemAltitude = action.payload;
		},
		setPausedLineId: (state, action: PayloadAction<number | null>) => {
			state.pausedLineId = action.payload;
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
	setLineWidth,
	setLastWrittenPosition,
	setLastWrittenTime,
	setRecordingStartTime,
	setResumePending,
	setResumePromptPending,
	setUseDemAltitude,
	setPausedLineId,
	writeGnssPosition,
} = trackRecordingSlice.actions;

export default trackRecordingSlice.reducer;

/**
 * Start recording a new track: switches GNSS on and registers the
 * recording foreground task (shared BackgroundTaskService notification).
 * The track's line is created lazily by the writeGnssPosition listener
 * once two native positions exist — a single-point LineString is invalid
 * GeoJSON and SpatiaLite's GeomFromGeoJSON rejects it (NOT NULL
 * constraint on lines.geometry).
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

	// A manual start supersedes a pending restore-resume.
	dispatch(setResumePending(false));
	dispatch(setResumePromptPending(false));
	dispatch(setIsRecordingAction(true));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	dispatch(setPausedLineId(null));
	dispatch(setRecordingStartTime(now));

	// Register the foreground task — keeps the shared "Recording track"
	// notification alive while the app is backgrounded. Non-fatal.
	await startRecordingTask();
};

/**
 * Continue recording on an existing line (the line carries the system
 * 'recorded' tag).  Appends to the line's current geometry; reuses its
 * existing track row or creates one when missing.  Start/stop are the
 * only states — a continued line behaves exactly like a fresh one.
 */
export const continueRecording =
	(lineId: number): AppThunk =>
	async (dispatch, getState) => {
		// Guard: don't start a second recording
		if (selectIsRecording(getState())) {
			return;
		}
		// Guard: a line cannot be the followed line and the recording
		// line at the same time.
		if (selectFollowingLineId(getState()) === lineId) {
			return;
		}

		// Recording requires GNSS — switch it on.
		dispatch(setIsActive(true));
		dispatch(setResumePending(false));
		dispatch(setActiveLineId(lineId));
		dispatch(setPausedLineId(null));
		// The line may have been removed from the map while paused
		// (which releases the paused state) — continuing must put it
		// back in the drawer list. Idempotent when already selected.
		dispatch(setLineSelected(lineId, true));
		dispatch(setIsRecordingAction(true));
		dispatch(setRecordingStartTime(Date.now()));

		const state = getState().trackRecording;
		try {
			const existing = await queryTrackByLineId(lineId);
			if (existing?.id != null) {
				dispatch(setActiveTrackId(existing.id));
			} else {
				const trackResult = await createTrack({
					line_id: lineId,
					settings: {
						minDistance: state.minDistance,
						minTime: state.minTime,
						minPrecision: state.minPrecision,
					},
				});
				if (trackResult?.id != null) {
					dispatch(setActiveTrackId(trackResult.id));
				}
			}
		} catch (err) {
			// Track-row bookkeeping is non-critical — appends work without it.
			logError('trackRecording/continueRecording.track', err);
		}

		// Register the foreground task. Non-fatal.
		await startRecordingTask();
	};

/**
 * Continue the recording restored after an app kill — called by the
 * ResumeRecordingPrompt overlay's Continue button.  Verifies the
 * restored line still exists, then arms the deferred resume (first
 * native GNSS position re-activates recording) and switches GNSS on.
 * Returns false when the line is gone (caller shows a toast).
 */
export const confirmRecordingResume =
	(): AppThunk<Promise<boolean>> => async (dispatch, getState) => {
		dispatch(setResumePromptPending(false));

		const { activeLineId, isRecording } = getState().trackRecording;

		// Already recording (double-tap on Continue) — nothing to arm.
		if (isRecording) {
			return true;
		}

		if (typeof activeLineId !== 'number') {
			return false;
		}

		let exists = false;
		try {
			exists = await queryLineExists(activeLineId);
		} catch (err) {
			logError('trackRecording/confirmRecordingResume.lineExists', err);
		}

		if (!exists) {
			// The recorded line was deleted — abandon the restored
			// recording instead of resuming into a void.
			dispatch(setIsRecordingAction(false));
			dispatch(setResumePending(false));
			dispatch(setActiveTrackId(null));
			dispatch(setActiveLineId(null));
			dispatch(setPausedLineId(null));
			dispatch(setRecordingStartTime(null));
			return false;
		}

		dispatch(setResumePending(true));
		dispatch(setIsActive(true));

		// Register the location foreground task now — the app is
		// foreground here (the user just tapped Continue).  Starting it
		// from the deferred first-fix listener instead would risk a
		// ForegroundServiceStartNotAllowedException if the user
		// backgrounded the app before the first GNSS fix arrived.
		// Idempotent — the listener's call is a no-op afterwards.
		await startRecordingTask();
		return true;
	};

/**
 * Stop recording. Finalizes the track and unregisters the foreground
 * task. Stop and pause are the same — the just-recorded line is parked
 * in pausedLineId so it stays rendered as the recording line (on top)
 * until it is removed from the map; re-adding it renders it as a normal
 * line again. Any recorded line can be continued via continueRecording.
 */
export const stopRecording = (): AppThunk => async (dispatch, getState) => {
	const pausedLineId = selectActiveLineId(getState());
	dispatch(setPausedLineId(pausedLineId));
	dispatch(setIsRecordingAction(false));
	dispatch(setResumePending(false));
	dispatch(setResumePromptPending(false));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	dispatch(setRecordingStartTime(null));

	// Unregister the foreground task. Non-fatal.
	await stopRecordingTask();
};

/**
 * Pause the active recording state and show the resume prompt — used
 * when the app's surface was destroyed while recording (swipe-close
 * with the foreground service keeping the process alive): Redux still
 * says isRecording but the map + GNSS pipeline died with the surface.
 * Keeps activeLineId/activeTrackId/recordingStartTime so the prompt's
 * Continue path (confirmRecordingResume) can resume the same line.
 */
export const pauseRecordingForPrompt = (): AppThunk => async (dispatch) => {
	dispatch(setIsRecordingAction(false));
	dispatch(setResumePromptPending(true));

	// Remove the stale "Recording track" notification — nothing is
	// recording until the user continues (resume re-registers it).
	await stopRecordingTask();
};
