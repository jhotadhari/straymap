/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.trackRecording.initialized;
export const selectIsRecording = (state: RootState) => state.trackRecording.isRecording;
export const selectResumePending = (state: RootState) => state.trackRecording.resumePending;
export const selectResumePromptPending = (state: RootState) =>
	state.trackRecording.resumePromptPending;
export const selectUseDemAltitude = (state: RootState) => state.trackRecording.useDemAltitude;
export const selectActiveTrackId = (state: RootState) => state.trackRecording.activeTrackId;
export const selectActiveLineId = (state: RootState) => state.trackRecording.activeLineId;
export const selectPausedLineId = (state: RootState) => state.trackRecording.pausedLineId;
/**
 * The line the track-recording feature owns: the actively recorded line,
 * or the last recorded line parked after a stop (stop is pause).
 */
export const selectTrackLineId = (state: RootState) =>
	state.trackRecording.activeLineId ?? state.trackRecording.pausedLineId;
export const selectMinDistance = (state: RootState) => state.trackRecording.minDistance;
export const selectMinTime = (state: RootState) => state.trackRecording.minTime;
export const selectMinPrecision = (state: RootState) => state.trackRecording.minPrecision;
export const selectLastWrittenPosition = (state: RootState) =>
	state.trackRecording.lastWrittenPosition;
export const selectLastWrittenTime = (state: RootState) => state.trackRecording.lastWrittenTime;
export const selectRecordingStartTime = (state: RootState) =>
	state.trackRecording.recordingStartTime;
