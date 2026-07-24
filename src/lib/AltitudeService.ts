/**
 * Singleton service that bridges useMap() hook functions to non-React
 * code (thunks, provider implementations).
 *
 * RoutingMapView wires the functions on mount / unwires on unmount.
 * Downstream callers (routing/utils.ts, altitude thunks) read them
 * without needing the React tree.
 *
 * All public getters return null when not yet wired so callers can
 * degrade gracefully (best-effort elevation).
 */

/**
 * Internal dependencies
 */
import { getRetryDelay } from './utils';

type AltitudeFn = (lng: number, lat: number) => Promise<number | null>;
type HasDataFn = (lng: number, lat: number) => Promise<boolean>;
type SetCacheCapacityFn = (capacity: number) => Promise<void>;
type IsTileCachedFn = (lng: number, lat: number) => Promise<boolean>;

/** The set of functions wired from a useMap() hook. */
export interface AltitudeFns {
	getAltitudeAtPosition: AltitudeFn;
	hasDataAtPosition: HasDataFn;
	setCacheCapacity: SetCacheCapacityFn;
	isTileCached: IsTileCachedFn;
}

const RETRY_DELAY_MS = 200;
const MAX_RETRIES = 5;
const MAX_ALTITUDE_RETRIES = 10;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class AltitudeService {
	private _altitudeFn: AltitudeFn | null = null;
	private _hasDataFn: HasDataFn | null = null;
	private _setCacheCapacityFn: SetCacheCapacityFn | null = null;
	private _isTileCachedFn: IsTileCachedFn | null = null;

	// ── Wiring (called by RoutingMapView) ──────────────────────────

	/** Wire all four functions at once. Preferred over individual setters. */
	wire(fns: AltitudeFns): void {
		this._altitudeFn = fns.getAltitudeAtPosition;
		this._hasDataFn = fns.hasDataAtPosition;
		this._setCacheCapacityFn = fns.setCacheCapacity;
		this._isTileCachedFn = fns.isTileCached;
	}

	/** Unwire all four functions at once. */
	unwire(): void {
		this._altitudeFn = null;
		this._hasDataFn = null;
		this._setCacheCapacityFn = null;
		this._isTileCachedFn = null;
	}

	// Individual setters — kept for callers that set one at a time
	// (prefer wire() / unwire() in new code).
	setAltitudeLookup = (fn: AltitudeFn | null) => {
		this._altitudeFn = fn;
	};
	setHasDataLookup = (fn: HasDataFn | null) => {
		this._hasDataFn = fn;
	};
	setCacheCapacityLookup = (fn: SetCacheCapacityFn | null) => {
		this._setCacheCapacityFn = fn;
	};
	setIsTileCachedLookup = (fn: IsTileCachedFn | null) => {
		this._isTileCachedFn = fn;
	};

	// ── Raw getters (for library integrations) ─────────────────────

	getRawAltitudeFn = (): AltitudeFn | null => this._altitudeFn;
	getRawHasDataFn = (): HasDataFn | null => this._hasDataFn;
	getSetCacheCapacityFn = (): SetCacheCapacityFn | null => this._setCacheCapacityFn;
	getIsTileCachedFn = (): IsTileCachedFn | null => this._isTileCachedFn;

	// ── Convenience queries (for thunks) ───────────────────────────

	/**
	 * Returns true if an HGT file exists that covers the given coordinate.
	 * Does not trigger a preload — only checks the filename index.
	 */
	hasDataAtPosition = async (lng: number, lat: number): Promise<boolean> => {
		if (!this._hasDataFn) return false;
		return this._hasDataFn(lng, lat);
	};

	/**
	 * Returns the elevation at the given coordinate, or null.
	 *
	 * When the lookup function hasn't been wired yet, retries for up to
	 * {@link MAX_RETRIES} × {@link RETRY_DELAY_MS} (1 s total).  When the
	 * wired function returns null (cache miss), retries with backoff up to
	 * {@link MAX_ALTITUDE_RETRIES} times (~3 s total).
	 */
	getAltitudeAtPosition = async (lng: number, lat: number): Promise<number | null> => {
		// Wait for the lookup function to be wired.
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if (this._altitudeFn) break;
			if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS);
		}
		if (!this._altitudeFn) {
			console.warn(
				'altitudeService.getAltitudeAtPosition: altitude lookup not wired after ' +
					`${MAX_RETRIES} retries (${RETRY_DELAY_MS}ms each). ` +
					'RoutingMapView may not have mounted yet.'
			);
			return null;
		}

		// Retry on cache miss with backoff.
		for (let attempt = 0; attempt <= MAX_ALTITUDE_RETRIES; attempt++) {
			const result = await this._altitudeFn(lng, lat);
			if (result !== null) return result;
			if (attempt < MAX_ALTITUDE_RETRIES) await delay(getRetryDelay(attempt));
		}
		return null;
	};
}

export const altitudeService = new AltitudeService();
