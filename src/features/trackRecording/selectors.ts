/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.trackRecording.initialized;
export const selectIsRecording = (state: RootState) => state.trackRecording.isRecording;
export const selectActiveTrackId = (state: RootState) => state.trackRecording.activeTrackId;
export const selectActiveLineId = (state: RootState) => state.trackRecording.activeLineId;
export const selectMinDistance = (state: RootState) => state.trackRecording.minDistance;
export const selectMinTime = (state: RootState) => state.trackRecording.minTime;
export const selectMinPrecision = (state: RootState) => state.trackRecording.minPrecision;
export const selectLastWrittenPosition = (state: RootState) =>
	state.trackRecording.lastWrittenPosition;
export const selectLastWrittenTime = (state: RootState) => state.trackRecording.lastWrittenTime;
export const selectRecordingStartTime = (state: RootState) =>
	state.trackRecording.recordingStartTime;
