/**
 * Tests for gnss slice reducers and initial state.
 */

/**
 * Internal dependencies
 */
import gnssReducer, {
	setIsActive,
	setIsCenterActive,
	setRecenterDelaySec,
	setGnssPosition,
	GnssPositionData,
} from '../slice';

describe('gnss slice reducers', () => {
	it('initial state has GNSS off, center mode off, 10s recenter delay', () => {
		const state = gnssReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isActive).toBe(false);
		expect(state.isCenterActive).toBe(false);
		expect(state.recenterDelaySec).toBe(10);
		expect(state.position).toBeNull();
	});

	it('setIsActive(false) clears the live position', () => {
		const position: GnssPositionData = {
			lng: 7,
			lat: 47,
			altitude: 500,
			bearing: 90,
			accuracy: 3,
			speed: 1.2,
			timestamp: 1234567890,
		};
		let state = gnssReducer(undefined, setGnssPosition(position));
		expect(state.position).toEqual(position);
		state = gnssReducer(state, setIsActive(false));
		expect(state.position).toBeNull();
	});

	it('setIsCenterActive toggles center mode', () => {
		let state = gnssReducer(undefined, setIsCenterActive(true));
		expect(state.isCenterActive).toBe(true);
		state = gnssReducer(state, setIsCenterActive(false));
		expect(state.isCenterActive).toBe(false);
	});

	it('setRecenterDelaySec updates the delay', () => {
		const state = gnssReducer(undefined, setRecenterDelaySec(4.5));
		expect(state.recenterDelaySec).toBe(4.5);
	});
});
