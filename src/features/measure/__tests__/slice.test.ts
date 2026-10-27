/**
 * Tests for measure slice reducers and initial state.
 */

/**
 * Internal dependencies
 */
import measureReducer, { clearMeasurement, startMeasurement } from '../slice';

describe('measure slice reducers', () => {
	it('initial state has no measurement', () => {
		const state = measureReducer(undefined, { type: '@@INIT' } as any);
		expect(state.initialized).toBe(true);
		expect(state.position).toBeNull();
	});

	it('startMeasurement sets the measured position', () => {
		const state = measureReducer(undefined, startMeasurement({ lng: 7, lat: 47 }));
		expect(state.position).toEqual({ lng: 7, lat: 47 });
	});

	it('startMeasurement replaces an existing measurement', () => {
		let state = measureReducer(undefined, startMeasurement({ lng: 7, lat: 47 }));
		state = measureReducer(state, startMeasurement({ lng: 8, lat: 48 }));
		expect(state.position).toEqual({ lng: 8, lat: 48 });
	});

	it('clearMeasurement removes the measurement', () => {
		let state = measureReducer(undefined, startMeasurement({ lng: 7, lat: 47 }));
		state = measureReducer(state, clearMeasurement());
		expect(state.position).toBeNull();
	});
});
