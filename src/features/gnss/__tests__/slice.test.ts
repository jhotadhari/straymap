/**
 * Tests for gnss slice reducers and initial state.
 */

/**
 * Internal dependencies
 */
import gnssReducer, {
	setIsActive,
	setMarkerIconSource,
	setMarkerSize,
	setMarkerColor,
	setMarkerDirection,
	setAccuracyCircleThresholdMeters,
	setShowMeasurementLabel,
} from '../slice';

/** Dispatch a live GNSS fix (0.001° lat per second ≈ 111 m/s derived). */
const pos = (lng: number, lat: number, speed: number, timestamp: number) =>
	({
		type: 'gnss/setGnssPosition',
		payload: {
			lng,
			lat,
			altitude: null,
			bearing: -1,
			accuracy: 5,
			speed,
			timestamp,
		},
	}) as any;

describe('gnss slice reducers', () => {
	it('initial state has sensible marker defaults', () => {
		const state = gnssReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isActive).toBe(false);
		expect(state.markerIconSource).toBe('materialNavigation');
		expect(state.markerSize).toBe(26);
		expect(state.markerColor).toBe('#F50000');
		expect(state.markerDirection).toBe('movingDirection');
		expect(state.accuracyCircleThresholdMeters).toBe(10);
		expect(state.showMeasurementLabel).toBe(true);
	});

	it('setIsActive(false) clears position and heading state', () => {
		let state = gnssReducer(undefined, setIsActive(true));
		state = gnssReducer(state, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 1,
				lat: 2,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 1,
			},
		} as any);
		state = gnssReducer(state, setIsActive(false));
		expect(state.position).toBeNull();
		expect(state.heading).toBeNull();
		expect(state.headingAnchor).toBeNull();
	});

	it('setMarkerIconSource updates the marker icon', () => {
		const state = gnssReducer(undefined, setMarkerIconSource('/marker/foo.svg'));
		expect(state.markerIconSource).toBe('/marker/foo.svg');
	});

	it('setMarkerSize updates the marker size', () => {
		const state = gnssReducer(undefined, setMarkerSize(32));
		expect(state.markerSize).toBe(32);
	});

	it('setMarkerColor updates the marker color', () => {
		const state = gnssReducer(undefined, setMarkerColor('#00ff00'));
		expect(state.markerColor).toBe('#00ff00');
	});

	it('setMarkerDirection updates the marker direction', () => {
		const state = gnssReducer(undefined, setMarkerDirection('compass'));
		expect(state.markerDirection).toBe('compass');
	});

	it('setAccuracyCircleThresholdMeters updates the threshold (0 disables)', () => {
		const state = gnssReducer(undefined, setAccuracyCircleThresholdMeters(0));
		expect(state.accuracyCircleThresholdMeters).toBe(0);
	});

	it('setShowMeasurementLabel toggles the measurement label', () => {
		const state = gnssReducer(undefined, setShowMeasurementLabel(false));
		expect(state.showMeasurementLabel).toBe(false);
	});

	it('derived speed is null after the first fix and set after the second', () => {
		let state = gnssReducer(undefined, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 1000,
			},
		} as any);
		expect(state.derivedSpeed).toBeNull();
		expect(state.prevFix).toEqual({ lng: 0, lat: 0, timestamp: 1000 });

		state = gnssReducer(state, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0.001,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 2000,
			},
		} as any);
		// 0.001° lat ≈ 111.32 m over 1 s.
		expect(state.derivedSpeed).toBeGreaterThan(109);
		expect(state.derivedSpeed).toBeLessThan(114);
		expect(state.prevFix).toEqual({ lng: 0, lat: 0.001, timestamp: 2000 });
	});

	it('derived speed is null for equal timestamps and resets with the position', () => {
		let state = gnssReducer(undefined, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 1000,
			},
		} as any);
		state = gnssReducer(state, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0.001,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 1000,
			},
		} as any);
		expect(state.derivedSpeed).toBeNull();

		state = gnssReducer(state, {
			type: 'gnss/setGnssPosition',
			payload: null,
		} as any);
		expect(state.prevFix).toBeNull();
		expect(state.derivedSpeed).toBeNull();
	});

	it('setIsActive(false) clears prevFix and derivedSpeed', () => {
		let state = gnssReducer(undefined, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 1000,
			},
		} as any);
		state = gnssReducer(state, {
			type: 'gnss/setGnssPosition',
			payload: {
				lng: 0,
				lat: 0.001,
				altitude: null,
				bearing: -1,
				accuracy: 5,
				speed: 0,
				timestamp: 2000,
			},
		} as any);
		expect(state.derivedSpeed).not.toBeNull();
		state = gnssReducer(state, setIsActive(false));
		expect(state.prevFix).toBeNull();
		expect(state.derivedSpeed).toBeNull();
	});

	describe('speed-fallback latch', () => {
		/** Engage the fallback: 1 seed fix + 5 qualifying fixes
		 * (raw 0, derived ~111 m/s). */
		const engage = () => {
			let state = gnssReducer(undefined, pos(0, 0, 0, 1000));
			for (let i = 1; i <= 5; i++) {
				state = gnssReducer(state, pos(0, i * 0.001, 0, 1000 + i * 1000));
			}
			return state;
		};

		it('engages only after consecutive qualifying fixes', () => {
			let state = gnssReducer(undefined, pos(0, 0, 0, 1000));
			for (let i = 1; i < 5; i++) {
				state = gnssReducer(state, pos(0, i * 0.001, 0, 1000 + i * 1000));
				expect(state.speedFallbackActive).toBe(false);
			}
			state = gnssReducer(state, pos(0, 0.005, 0, 6000));
			expect(state.speedFallbackActive).toBe(true);
			expect(state.fallbackVotes).toBe(0);
		});

		it('resets votes when a fix is not qualifying', () => {
			let state = gnssReducer(undefined, pos(0, 0, 0, 1000));
			state = gnssReducer(state, pos(0, 0.001, 0, 2000)); // vote 1
			state = gnssReducer(state, pos(0, 0.002, 0, 3000)); // vote 2
			// No movement → derived 0 → not qualifying.
			state = gnssReducer(state, pos(0, 0.002, 0, 4000));
			expect(state.speedFallbackActive).toBe(false);
			expect(state.fallbackVotes).toBe(0);
		});

		it('raw speed near zero with low derived speed never engages', () => {
			// Stationary drift: raw 0, derived ~0 (same position).
			let state = gnssReducer(undefined, pos(0, 0, 0, 1000));
			for (let i = 0; i < 10; i++) {
				state = gnssReducer(state, pos(0, 0, 0, 2000 + i * 1000));
			}
			expect(state.speedFallbackActive).toBe(false);
			expect(state.fallbackVotes).toBe(0);
		});

		it('engages on sustained slow spoofed movement (~2 m/s)', () => {
			// 3 m per 1.5 s — a slow spoofer stream: derived ≈ 2.2 m/s.
			let state = gnssReducer(undefined, pos(0, 0, 0, 0));
			for (let i = 1; i <= 5; i++) {
				state = gnssReducer(state, pos(0, i * 3e-5, 0, i * 1500));
			}
			expect(state.derivedSpeed).toBeGreaterThan(2);
			expect(state.derivedSpeed).toBeLessThan(3);
			expect(state.speedFallbackActive).toBe(true);
		});

		it('exits immediately when the raw speed clearly recovers', () => {
			let state = engage();
			expect(state.speedFallbackActive).toBe(true);
			state = gnssReducer(state, pos(0, 0.006, 1.5, 7000));
			expect(state.speedFallbackActive).toBe(false);
			expect(state.fallbackVotes).toBe(0);
		});

		it('exits after consecutive fixes without derived movement', () => {
			let state = engage();
			// Two stops: derived 0 (no movement) while raw stays 0.
			state = gnssReducer(state, pos(0, 0.005, 0, 7000));
			expect(state.speedFallbackActive).toBe(true);
			state = gnssReducer(state, pos(0, 0.005, 0, 8000));
			expect(state.speedFallbackActive).toBe(true);
			state = gnssReducer(state, pos(0, 0.005, 0, 9000));
			expect(state.speedFallbackActive).toBe(false);
		});

		it('clears the latch when the position resets or GNSS turns off', () => {
			let state = engage();
			state = gnssReducer(state, { type: 'gnss/setGnssPosition', payload: null } as any);
			expect(state.speedFallbackActive).toBe(false);
			expect(state.fallbackVotes).toBe(0);

			state = engage();
			state = gnssReducer(state, setIsActive(false));
			expect(state.speedFallbackActive).toBe(false);
			expect(state.fallbackVotes).toBe(0);
		});
	});
});
