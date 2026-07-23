/**
 * Module-level singleton for altitude lookups from thunks.
 *
 * useMap().getAltitudeAtPosition / hasDataAtPosition are only available inside
 * React components (they're hooks).  This module bridges the gap: RoutingMapView
 * wires the functions on mount, and provider implementations (e.g. straight-line)
 * read them without needing the React tree.
 *
 * When no function is set, lookups resolve to null / false (best-effort).
 */

type AltitudeFn = (lng: number, lat: number) => Promise<number | null>;
type HasDataFn = (lng: number, lat: number) => Promise<boolean>;
type SetCacheCapacityFn = (capacity: number) => Promise<void>;
type IsTileCachedFn = (lng: number, lat: number) => Promise<boolean>;

let _altitudeFn: AltitudeFn | null = null;
let _hasDataFn: HasDataFn | null = null;
let _setCacheCapacityFn: SetCacheCapacityFn | null = null;
let _isTileCachedFn: IsTileCachedFn | null = null;

import { getRetryDelay } from '../../lib/utils';

const RETRY_DELAY_MS = 200;
const MAX_RETRIES = 5;

const MAX_ALTITUDE_RETRIES = 10;

export const setAltitudeLookup = (fn: AltitudeFn | null) => {
	_altitudeFn = fn;
};

export const setHasDataLookup = (fn: HasDataFn | null) => {
	_hasDataFn = fn;
};

export const setCacheCapacityLookup = (fn: SetCacheCapacityFn | null) => {
	_setCacheCapacityFn = fn;
};

/**
 * Returns the raw native altitude function without the retry wrapper.
 * The caller is responsible for retry / fencing logic — this is the
 * integration point for the library's enrichCoordinatesWithElevation.
 */
export const getRawAltitudeFn = (): AltitudeFn | null => _altitudeFn;

/**
 * Returns the raw native hasData function — same contract as the
 * wired function, exposed for library consumers.
 */
export const getRawHasDataFn = (): HasDataFn | null => _hasDataFn;

/**
 * Returns the wired setCacheCapacity function, or null if not wired.
 */
export const getSetCacheCapacityFn = (): SetCacheCapacityFn | null => _setCacheCapacityFn;

export const setIsTileCachedLookup = (fn: IsTileCachedFn | null) => {
	_isTileCachedFn = fn;
};

export const getIsTileCachedFn = (): IsTileCachedFn | null => _isTileCachedFn;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Returns the elevation at the given coordinate, or null.
 *
 * When the lookup function hasn't been wired yet, retries for up to
 * {@link MAX_RETRIES} × {@link RETRY_DELAY_MS} (1 s total).  When the
 * wired function returns null (cache miss), retries with backoff up to
 * {@link MAX_ALTITUDE_RETRIES} times (~3 s total).
 */
export const getAltitudeAtPosition = async (lng: number, lat: number): Promise<number | null> => {
	// Wait for the lookup function to be wired.
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		if (_altitudeFn) break;
		if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS);
	}
	if (!_altitudeFn) {
		console.warn(
			'altitude.getAltitudeAtPosition: altitude lookup not wired after ' +
				`${MAX_RETRIES} retries (${RETRY_DELAY_MS}ms each). ` +
				'RoutingMapView may not have mounted yet.'
		);
		return null;
	}

	// Retry on cache miss with backoff.
	for (let attempt = 0; attempt <= MAX_ALTITUDE_RETRIES; attempt++) {
		const result = await _altitudeFn(lng, lat);
		if (result !== null) return result;
		if (attempt < MAX_ALTITUDE_RETRIES) await delay(getRetryDelay(attempt));
	}
	return null;
};

/**
 * Returns true if an HGT file exists that covers the given coordinate.
 * Does not trigger a preload — only checks the filename index.
 */
export const hasDataAtPosition = async (lng: number, lat: number): Promise<boolean> => {
	if (!_hasDataFn) return false;
	return _hasDataFn(lng, lat);
};
