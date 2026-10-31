/**
 * External dependencies
 */
import { useSyncExternalStore } from 'react';

/**
 * Lightweight store for the device compass azimuth.
 *
 * The native compass event fires at ~30 Hz while the device turns — routing
 * it through Redux would dispatch and walk the listener middleware on every
 * event, and any component subscribing to the azimuth would re-render the
 * whole slice tree. Instead AppView writes the latest azimuth here
 * imperatively and only the consumers that render the azimuth subscribe via
 * useDeviceAzimuth(), so a single marker component re-renders — and only
 * when the whole-degree value actually changed.
 */

let azimuth: number | null = null;
const listeners = new Set<() => void>();

export const setDeviceAzimuth = (next: number | null): void => {
	if (next === azimuth) {
		return;
	}
	azimuth = next;
	listeners.forEach((listener) => listener());
};

export const getDeviceAzimuth = (): number | null => azimuth;

export const subscribeDeviceAzimuth = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** Subscribe to the device compass azimuth — re-renders the calling
 * component only when the value changes. */
export const useDeviceAzimuth = (): number | null =>
	useSyncExternalStore(subscribeDeviceAzimuth, getDeviceAzimuth);
