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
});
