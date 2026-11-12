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
	initialSettings,
	setInitialized,
	setRecordedDistanceM,
	addRecordedDistanceM,
	startRecording,
} from '../slice';
import { selectRecordedDistanceM } from '../selectors';
import { saveToStorage } from '../connectStorage';

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

	describe('recordedDistanceM (runtime-only)', () => {
		it('starts unavailable and is not part of the persisted settings shape', () => {
			const state = trackRecordingReducer(undefined, { type: '@@INIT' } as any);
			expect(state.recordedDistanceM).toBeNull();
			expect(Object.keys(initialSettings)).not.toContain('recordedDistanceM');
		});

		it('is not written by saveToStorage', () => {
			const DefaultPreference = require('react-native-default-preference');
			let state = trackRecordingReducer(undefined, setInitialized(true));
			state = trackRecordingReducer(state, setRecordedDistanceM(1234));
			saveToStorage(state, 'test');
			const calls = (DefaultPreference.set as jest.Mock).mock.calls;
			const saved = JSON.parse(calls[calls.length - 1][1]);
			expect(saved).not.toHaveProperty('recordedDistanceM');
		});

		it('accumulates segments incrementally', () => {
			let state = trackRecordingReducer(undefined, setRecordedDistanceM(0));
			state = trackRecordingReducer(state, addRecordedDistanceM(10));
			state = trackRecordingReducer(state, addRecordedDistanceM(2.5));
			expect(state.recordedDistanceM).toBeCloseTo(12.5);
		});

		it('ignores increments while unavailable (null)', () => {
			const state = trackRecordingReducer(undefined, addRecordedDistanceM(10));
			expect(state.recordedDistanceM).toBeNull();
		});

		it('stays readable after stopRecording-style state changes, reset by onSetDbPath', () => {
			let state = trackRecordingReducer(undefined, setRecordedDistanceM(500));
			state = trackRecordingReducer(state, setIsRecordingAction(true));
			state = trackRecordingReducer(state, setIsRecordingAction(false));
			expect(state.recordedDistanceM).toBe(500);

			const dispatch = jest.fn((action: any) => {
				state = trackRecordingReducer(state, action);
			});
			onSetDbPath()(dispatch, jest.fn(), undefined as any);
			expect(state.recordedDistanceM).toBeNull();
		});

		it('startRecording resets it to null', async () => {
			let state = trackRecordingReducer(undefined, setRecordedDistanceM(500));
			const dispatch = jest.fn((action: any) => {
				if (typeof action === 'object') {
					state = trackRecordingReducer(state, action);
				}
			});
			await startRecording()(
				dispatch,
				() => ({ trackRecording: state }) as any,
				undefined as any
			);
			expect(state.recordedDistanceM).toBeNull();
		});

		it('selectRecordedDistanceM reads the slice value', () => {
			const state = trackRecordingReducer(undefined, setRecordedDistanceM(42));
			expect(selectRecordedDistanceM({ trackRecording: state } as any)).toBe(42);
		});
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
