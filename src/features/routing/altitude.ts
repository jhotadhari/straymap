/**
 * Module-level singleton for altitude lookups from thunks.
 *
 * useMap().getAltitudeAtPosition is only available inside React components
 * (it's a hook).  This module bridges the gap: RoutingMapView wires the
 * function on mount, and provider implementations (e.g. straight-line) read
 * it without needing the React tree.
 *
 * When no function is set, altitude lookups resolve to null (best-effort).
 */

type AltitudeFn = (lng: number, lat: number) => Promise<number | null>;

let _fn: AltitudeFn | null = null;

const RETRY_DELAY_MS = 200;
const MAX_RETRIES = 5;

export const setAltitudeLookup = (fn: AltitudeFn | null) => {
	_fn = fn;
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const getAltitudeAtPosition = async (lng: number, lat: number): Promise<number | null> => {
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		if (_fn) {
			return _fn(lng, lat);
		}
		if (attempt < MAX_RETRIES) {
			await delay(RETRY_DELAY_MS);
		}
	}
	console.warn(
		'altitude.getAltitudeAtPosition: altitude lookup not wired after ' +
			`${MAX_RETRIES} retries (${RETRY_DELAY_MS}ms each). ` +
			'RoutingMapView may not have mounted yet.'
	);
	return null;
};
