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
	setActiveTrackId,
	setActiveLineId,
	setPausedLineId,
	setRecordingStartTime,
	setLastRecordedLineId,
	onSetDbPath,
} from '../slice';

describe('trackRecording slice reducers', () => {
	it('initial state has recording off and DEM altitude on', () => {
		const state = trackRecordingReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isRecording).toBe(false);
		expect(state.resumePending).toBe(false);
		expect(state.resumePromptPending).toBe(false);
		expect(state.useDemAltitude).toBe(true);
		expect(state.activeLineId).toBeNull();
		expect(state.pausedLineId).toBeNull();
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

	it('setPausedLineId parks the stopped recording line', () => {
		let state = trackRecordingReducer(undefined, setPausedLineId(42));
		expect(state.pausedLineId).toBe(42);
		state = trackRecordingReducer(state, setPausedLineId(null));
		expect(state.pausedLineId).toBeNull();
	});

	it('setLastRecordedLineId sets and clears the drawer last-recording pointer', () => {
		expect(
			trackRecordingReducer(undefined, { type: '@@INIT' } as any).lastRecordedLineId
		).toBeNull();
		let state = trackRecordingReducer(undefined, setLastRecordedLineId(42));
		expect(state.lastRecordedLineId).toBe(42);
		state = trackRecordingReducer(state, setLastRecordedLineId(null));
		expect(state.lastRecordedLineId).toBeNull();
	});

	describe('onSetDbPath', () => {
		it('clears all DB-local state for the db swap', () => {
			// Build a state where every DB-local field is set.
			let state = trackRecordingReducer(undefined, { type: '@@INIT' } as any);
			state = trackRecordingReducer(state, setIsRecordingAction(true));
			state = trackRecordingReducer(state, setResumePending(true));
			state = trackRecordingReducer(state, setResumePromptPending(true));
			state = trackRecordingReducer(state, setActiveTrackId(7));
			state = trackRecordingReducer(state, setActiveLineId(42));
			state = trackRecordingReducer(state, setPausedLineId(42));
			state = trackRecordingReducer(state, setRecordingStartTime(123456));
			state = trackRecordingReducer(state, setLastRecordedLineId(42));

			const dispatch = jest.fn((action: any) => {
				state = trackRecordingReducer(state, action);
			});
			onSetDbPath()(dispatch, jest.fn(), undefined as any);

			expect(state.isRecording).toBe(false);
			expect(state.resumePending).toBe(false);
			expect(state.resumePromptPending).toBe(false);
			expect(state.activeTrackId).toBeNull();
			expect(state.activeLineId).toBeNull();
			expect(state.pausedLineId).toBeNull();
			expect(state.recordingStartTime).toBeNull();
			expect(state.lastRecordedLineId).toBeNull();
		});
	});
});
