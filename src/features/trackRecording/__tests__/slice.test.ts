/**
 * Tests for trackRecording slice reducers and initial state.
 */

/**
 * Internal dependencies
 */
import trackRecordingReducer, {
	setIsRecordingAction,
	setResumePending,
	setResumePromptPending,
	setUseDemAltitude,
	setActiveLineId,
} from '../slice';

describe('trackRecording slice reducers', () => {
	it('initial state has recording off and DEM altitude on', () => {
		const state = trackRecordingReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isRecording).toBe(false);
		expect(state.resumePending).toBe(false);
		expect(state.resumePromptPending).toBe(false);
		expect(state.useDemAltitude).toBe(true);
		expect(state.activeLineId).toBeNull();
	});

	it('setIsRecordingAction(true) flags recording', () => {
		const state = trackRecordingReducer(undefined, setIsRecordingAction(true));
		expect(state.isRecording).toBe(true);
	});

	it('setIsRecordingAction(false) clears buffered position', () => {
		let state = trackRecordingReducer(undefined, setIsRecordingAction(true));
		state = trackRecordingReducer(state, {
			type: 'trackRecording/setLastWrittenPosition',
			payload: [
				1,
				2,
				3,
			],
		} as any);
		state = trackRecordingReducer(state, setIsRecordingAction(false));
		expect(state.lastWrittenPosition).toBeUndefined();
		expect(state.lastWrittenTime).toBeUndefined();
	});

	it('setResumePending toggles deferred resume', () => {
		const state = trackRecordingReducer(undefined, setResumePending(true));
		expect(state.resumePending).toBe(true);
	});

	it('setResumePromptPending toggles the kill-restore prompt', () => {
		const state = trackRecordingReducer(undefined, setResumePromptPending(true));
		expect(state.resumePromptPending).toBe(true);
	});

	it('setUseDemAltitude toggles DEM elevation preference', () => {
		const state = trackRecordingReducer(undefined, setUseDemAltitude(false));
		expect(state.useDemAltitude).toBe(false);
	});

	it('setActiveLineId updates the active line', () => {
		const state = trackRecordingReducer(undefined, setActiveLineId(42));
		expect(state.activeLineId).toBe(42);
	});
});
