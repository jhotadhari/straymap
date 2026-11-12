/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { GnssPosition } from 'react-native-mapsforge-vtm';

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
import { createTrack, finalizeTrackSummary } from './db/actionsTrack';
import { queryTrackByLineId, queryLineExists } from './db/queryFns';
import { clampLineWidth } from '../../lib/lineWidth';
import { TrackPointMeta } from './types';
import { queryLineGeom } from '../lines/db/queryFns';
import { haversineLineLength } from '../../lib/formatting';

/** Default recording line width (dp) — the recording path's stroke width. */
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
	/** The line of the most recently *stopped* recording — drives the
	 * tracking drawer's idle stats and its "Continue last" menu. Set on
	 * stopRecording, cleared when that line is deleted or removed from
	 * the map. Persisted (even when null) so a deliberate clear isn't
	 * undone by a DB fallback to an older recorded line. */
	lastRecordedLineId: number | null;
	minDistance: number;
	minTime: number;
	minPrecision: number;
	recordingStartTime: number | null;
	/** Recording line width (dp), clamped. Drives the path stroke width. */
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
	 * Transient — not persisted.  Metadata of the last buffered/written
	 * fix, kept alongside lastWrittenPosition so the write listener can
	 * derive the next point's segment speed and create track_points rows
	 * for the lazily created line's first two points.
	 */
	lastWrittenMeta?: TrackPointMeta;
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
	/**
	 * Transient — not persisted (deliberately NOT part of
	 * TrackRecordingSettings / initialSettings).  Running haversine
	 * length (m) of the recorded line, accumulated per append in the
	 * writeGnssPosition listener so no consumer rescans the growing
	 * geometry (O(n) per fix).  `null` = unavailable (line not created
	 * yet / not initialized).  Survives stopRecording (the paused state
	 * stays readable), reset by startRecording, initialized once from
	 * the line's geometry on continue / resume.
	 */
	recordedDistanceM: number | null;
}

export const initialSettings: TrackRecordingSettings = {
	isRecording: false,
	resumePending: false,
	useDemAltitude: true,
	activeTrackId: null,
	activeLineId: null,
	lastRecordedLineId: null,
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
	recordedDistanceM: null,
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
				state.lastWrittenMeta = undefined;
			}
		},
		setActiveTrackId: (state, action: PayloadAction<number | null>) => {
			state.activeTrackId = action.payload;
		},
		setActiveLineId: (state, action: PayloadAction<number | null>) => {
			state.activeLineId = action.payload;
		},
		setLastRecordedLineId: (state, action: PayloadAction<number | null>) => {
			state.lastRecordedLineId = action.payload;
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
		setLastWrittenMeta: (state, action: PayloadAction<TrackPointMeta | undefined>) => {
			state.lastWrittenMeta = action.payload;
		},
		/**
		 * Passthrough — no state change.  The connectStorage listener
		 * watches this action to write the native-filtered GNSS position
		 * (with altitude resolved) to the DB.
		 */
		writeGnssPosition: (_state, _action: PayloadAction<GnssPosition>) => {
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
		setRecordedDistanceM: (state, action: PayloadAction<number | null>) => {
			state.recordedDistanceM = action.payload;
		},
		/** Adds a segment length; a no-op while the distance is unavailable. */
		addRecordedDistanceM: (state, action: PayloadAction<number>) => {
			if (state.recordedDistanceM != null) {
				state.recordedDistanceM += action.payload;
			}
		},
	},
});

export const {
	setInitialized,
	setIsRecording: setIsRecordingAction,
	setActiveTrackId,
	setActiveLineId,
	setLastRecordedLineId,
	setMinDistance,
	setMinTime,
	setMinPrecision,
	setLineWidth,
	setLastWrittenPosition,
	setLastWrittenTime,
	setLastWrittenMeta,
	setRecordingStartTime,
	setResumePending,
	setResumePromptPending,
	setUseDemAltitude,
	setPausedLineId,
	setRecordedDistanceM,
	addRecordedDistanceM,
	writeGnssPosition,
} = trackRecordingSlice.actions;

/**
 * One O(n) pass over the line's stored geometry to (re)initialize the
 * running distance — used by continue / resume.  Display-only head
 * start: the writeGnssPosition listener re-seeds authoritatively
 * (serialized with the appends) on the first fix of the line, so this
 * only writes while nothing has been appended yet (`recordedDistanceM`
 * still null) and the line is still the active one.
 */
const initRecordedDistanceFromGeometry =
	(lineId: number): AppThunk =>
	async (dispatch, getState) => {
		try {
			const line = await queryLineGeom({ queryKey: ['lineGeom', lineId] });
			const trk = getState().trackRecording;
			if (trk.activeLineId !== lineId || trk.recordedDistanceM != null) {
				return;
			}
			const coords = line?.geometry?.coordinates;
			dispatch(setRecordedDistanceM(coords?.length ? haversineLineLength(coords) : 0));
		} catch (err) {
			logError('trackRecording/initRecordedDistance', err);
		}
	};

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
	dispatch(setRecordedDistanceM(null));
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
		// Distance of the existing geometry — null until the one-off
		// O(n) init below resolves, then incremented per append.
		dispatch(setRecordedDistanceM(null));
		dispatch(initRecordedDistanceFromGeometry(lineId));
		// The line may have been removed from the map while paused
		// (which releases the paused state) — continuing must put it
		// back in the drawer list. Idempotent when already selected.
		dispatch(setLineSelected(lineId, true));
		dispatch(setIsRecordingAction(true));
		dispatch(setRecordingStartTime(Date.now()));

		const state = getState().trackRecording;
		try {
			const existing = await queryTrackByLineId(lineId);
			// The recording may have been stopped (or re-targeted to
			// another line) while the DB round-trip was in flight —
			// resolving the stale track id now would clobber the current
			// session's activeTrackId.
			if (getState().trackRecording.activeLineId !== lineId) {
				return;
			}
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
				if (getState().trackRecording.activeLineId !== lineId) {
					return;
				}
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
			dispatch(setLastRecordedLineId(null));
			dispatch(setRecordingStartTime(null));
			return false;
		}

		dispatch(setResumePending(true));
		dispatch(setIsActive(true));
		// Killed-and-restored recording: the runtime distance is gone —
		// rebuild it from the stored geometry (activeLineId is already
		// restored, so the init's guard passes).
		dispatch(setRecordedDistanceM(null));
		dispatch(initRecordedDistanceFromGeometry(activeLineId));

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
	const state = getState().trackRecording;
	const pausedLineId = selectActiveLineId(getState());
	const activeTrackId = state.activeTrackId;
	dispatch(setPausedLineId(pausedLineId));
	dispatch(setIsRecordingAction(false));
	dispatch(setResumePending(false));
	dispatch(setResumePromptPending(false));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	// The just-stopped line becomes the tracking drawer's idle "last
	// recording" (stats + Continue-last menu). Only when a line exists —
	// a stop before the lazily created line's first two fixes parks
	// nothing and must keep the previous last recording.
	if (pausedLineId != null) {
		dispatch(setLastRecordedLineId(pausedLineId));
	}
	dispatch(setRecordingStartTime(null));

	// Finalize the track summary into tracks.data — a cache: raw
	// track_points + geometry remain the source of truth.  Non-critical;
	// a failure leaves a stale/missing summary that the next read
	// recomputes.
	if (pausedLineId != null && activeTrackId != null) {
		try {
			await finalizeTrackSummary(activeTrackId, pausedLineId);
		} catch (err) {
			logError('trackRecording/stopRecording.summary', err);
		}
	}

	// Unregister the foreground task. Non-fatal.
	await stopRecordingTask();
};

/**
 * Called when the database path changes (dbLoader `setDbPath` thunk
 * dispatches every feature's `onSetDbPath` hook). Clears all DB-local
 * state: the ids referenced rows in the OLD database and would point
 * into the void after the swap + restart.
 *
 * `setLastRecordedLineId(null)` is the important one: it is always
 * persisted (even as null) by `saveToStorage`, so the deliberate-clear
 * marker is written at swap time and the next start does NOT re-seed
 * the "Continue last recording" pointer from the new database.
 */
export const onSetDbPath = (): AppThunk => (dispatch) => {
	dispatch(setIsRecordingAction(false)); // resets lastWritten* too
	dispatch(setResumePending(false));
	dispatch(setResumePromptPending(false));
	dispatch(setActiveTrackId(null));
	dispatch(setActiveLineId(null));
	dispatch(setPausedLineId(null));
	dispatch(setRecordingStartTime(null));
	dispatch(setRecordedDistanceM(null));
	dispatch(setLastRecordedLineId(null)); // "deliberately cleared" marker
};
