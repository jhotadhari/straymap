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

export const setAltitudeLookup = (fn: AltitudeFn | null) => {
	_fn = fn;
};

export const getAltitudeAtPosition = (lng: number, lat: number): Promise<number | null> =>
	_fn ? _fn(lng, lat) : Promise.resolve(null);
