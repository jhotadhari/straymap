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
		expect(state.headingAnchor).toBeNull();
		expect(state.heading).toBeNull();
	});

	it('setIsActive(false) clears the live position, heading anchor and heading', () => {
		let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
		expect(state.position).not.toBeNull();
		state = gnssReducer(state, setIsActive(false));
		expect(state.position).toBeNull();
		expect(state.headingAnchor).toBeNull();
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
		it('first fix leaves heading null but records the anchor', () => {
			const state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			expect(state.heading).toBeNull();
			expect(state.headingAnchor).toEqual({ lng: 7, lat: 47, timestamp: 1234567890 });
		});

		it('movement beyond the threshold computes the heading (north)', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			// ~11 m due north — above the 5 m threshold.
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
		});

		it('movement beyond the threshold computes the heading (east)', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7.0001, 47)));
			expect(state.heading).toBeCloseTo(90, 2);
		});

		it('slow movement accumulates against the anchor and then updates', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			// ~2.2 m steps due north — each below the threshold.
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.00002, 1234567891)));
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.00004, 1234567892)));
			expect(state.heading).toBeNull();
			// Third step: ~6.7 m from the anchor — threshold crossed.
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.00006, 1234567893)));
			expect(state.heading).toBeCloseTo(0, 3);
		});

		it('movement below the threshold keeps the previous heading', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
			// ~0.7 m east — below the threshold, heading must not change.
			state = gnssReducer(state, setGnssPosition(makePosition(7.00001, 47.0001)));
			expect(state.heading).toBeCloseTo(0, 3);
		});

		it('a stale anchor resets without changing the heading', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47, 0)));
			state = gnssReducer(state, setGnssPosition(makePosition(7.0001, 47, 1000)));
			expect(state.heading).toBeCloseTo(90, 2);
			// Tiny step, 11 s later — anchor resets, heading unchanged.
			state = gnssReducer(state, setGnssPosition(makePosition(7.00011, 47, 12000)));
			expect(state.heading).toBeCloseTo(90, 2);
			// A small step right after the reset stays below the threshold.
			state = gnssReducer(state, setGnssPosition(makePosition(7.00012, 47, 13000)));
			expect(state.heading).toBeCloseTo(90, 2);
		});

		it('null position clears heading anchor and heading', () => {
			let state = gnssReducer(undefined, setGnssPosition(makePosition(7, 47)));
			state = gnssReducer(state, setGnssPosition(makePosition(7, 47.0001)));
			state = gnssReducer(state, setGnssPosition(null));
			expect(state.position).toBeNull();
			expect(state.headingAnchor).toBeNull();
			expect(state.heading).toBeNull();
		});
	});
});
