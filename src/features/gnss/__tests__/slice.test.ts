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

const makePosition = (lng: number, lat: number, timestamp = 1234567890): GnssPositionData => ({
	lng,
	lat,
	altitude: 500,
	bearing: -1,
	accuracy: 3,
	speed: 1.2,
	timestamp,
});

describe('gnss slice reducers', () => {
	it('initial state has GNSS off, center mode off, 10s recenter delay', () => {
		const state = gnssReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isActive).toBe(false);
		expect(state.isCenterActive).toBe(false);
		expect(state.recenterDelaySec).toBe(10);
		expect(state.position).toBeNull();
		expect(state.lastPosition).toBeNull();
		expect(state.heading).toBeNull();
	});

	it('setIsActive(false) clears the live position, last position and heading', () => {
		let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
		expect(state.position).not.toBeNull();
		state = gnssReducer(state, setIsActive(false));
		expect(state.position).toBeNull();
		expect(state.lastPosition).toBeNull();
		expect(state.heading).toBeNull();
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

	describe('heading derivation', () => {
		it('first fix leaves heading null but records the last position', () => {
			const state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			expect(state.heading).toBeNull();
			expect(state.lastPosition).toEqual({ lng: 7, lat: 47 });
		});

		it('movement beyond the threshold computes the heading (north)', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			// ~11 m due north — above the 3 m threshold.
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
		});

		it('movement beyond the threshold computes the heading (east)', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7.0001, 47)));
			expect(state.heading).toBeCloseTo(90, 2);
		});

		it('movement below the threshold keeps the previous heading', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
			// ~1 m east — below the threshold, heading must not change.
			state = gnssReducer(state, setGnssPosition(makePosition(7.00001, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
		});

		it('null position clears last position and heading', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			state = gnssReducer(state, setGnssPosition(null));
			expect(state.position).toBeNull();
			expect(state.lastPosition).toBeNull();
			expect(state.heading).toBeNull();
		});
	});
});
