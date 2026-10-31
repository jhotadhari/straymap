/**
 * Tests for the device-azimuth lightweight store.
 */

/**
 * Internal dependencies
 */
import {
	getDeviceAzimuth,
	setDeviceAzimuth,
	subscribeDeviceAzimuth,
} from '../deviceAzimuthStore';

describe('deviceAzimuthStore', () => {
	afterEach(() => {
		setDeviceAzimuth(null);
	});

	it('starts null and set updates the value', () => {
		expect(getDeviceAzimuth()).toBeNull();
		setDeviceAzimuth(42);
		expect(getDeviceAzimuth()).toBe(42);
		setDeviceAzimuth(null);
		expect(getDeviceAzimuth()).toBeNull();
	});

	it('same-value sets do not notify listeners', () => {
		setDeviceAzimuth(90);
		const listener = jest.fn();
		subscribeDeviceAzimuth(listener);
		setDeviceAzimuth(90);
		expect(listener).not.toHaveBeenCalled();
		setDeviceAzimuth(91);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('subscribe notifies on changes and unsubscribes cleanly', () => {
		const listener = jest.fn();
		const unsubscribe = subscribeDeviceAzimuth(listener);
		setDeviceAzimuth(1);
		expect(listener).toHaveBeenCalledTimes(1);
		unsubscribe();
		setDeviceAzimuth(2);
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
