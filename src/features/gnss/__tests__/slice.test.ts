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
	setDeviceAzimuth,
	setAccuracyCircleThresholdMeters,
	setShowMeasurementLabel,
} from '../slice';

describe('gnss slice reducers', () => {
	it('initial state has sensible marker defaults', () => {
		const state = gnssReducer(undefined, { type: '@@INIT' } as any);
		expect(state.isActive).toBe(false);
		expect(state.markerIconSource).toBe('triangle');
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
		state = gnssReducer(state, setDeviceAzimuth(42));
		state = gnssReducer(state, setIsActive(false));
		expect(state.position).toBeNull();
		expect(state.heading).toBeNull();
		expect(state.headingAnchor).toBeNull();
		expect(state.deviceAzimuth).toBeNull();
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
		const state = gnssReducer(undefined, setMarkerDirection('north'));
		expect(state.markerDirection).toBe('north');
	});

	it('setDeviceAzimuth updates and clears the compass azimuth', () => {
		let state = gnssReducer(undefined, setDeviceAzimuth(123));
		expect(state.deviceAzimuth).toBe(123);
		state = gnssReducer(state, setDeviceAzimuth(null));
		expect(state.deviceAzimuth).toBeNull();
	});

	it('setAccuracyCircleThresholdMeters updates the threshold (0 disables)', () => {
		const state = gnssReducer(undefined, setAccuracyCircleThresholdMeters(0));
		expect(state.accuracyCircleThresholdMeters).toBe(0);
	});

	it('setShowMeasurementLabel toggles the measurement label', () => {
		const state = gnssReducer(undefined, setShowMeasurementLabel(false));
		expect(state.showMeasurementLabel).toBe(false);
	});
});
