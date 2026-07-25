/**
 * Singleton service that bridges the map's nativeNodeHandle to non-React
 * code (thunks, provider implementations), using the library's
 * {@link createMapHandle} factory.
 *
 * RoutingMapView wires the handle on mount / unwires on unmount.
 * Downstream callers (routing/utils.ts, altitude thunks) read elevation
 * methods without needing the React tree.
 *
 * All public getters return null when not yet wired so callers can
 * degrade gracefully (best-effort elevation).
 */

/**
 * External dependencies
 */
import { createMapHandle } from 'react-native-mapsforge-vtm';

type MapHandle = ReturnType<typeof createMapHandle>;
type AltitudeFn = (lng: number, lat: number) => Promise<number | null>;
type HasDataFn = (lng: number, lat: number) => Promise<boolean>;
type SetCacheCapacityFn = (capacity: number) => Promise<void>;
type IsTileCachedFn = (lng: number, lat: number) => Promise<boolean>;

class AltitudeService {
	private _handle: MapHandle | null = null;

	// ── Wiring (called by RoutingMapView) ──────────────────────────

	/** Wire the nativeNodeHandle. Preferred over individual setters. */
	wire(nativeNodeHandle: number): void {
		this._handle = createMapHandle(nativeNodeHandle);
	}

	/** Unwire and release the handle. */
	unwire(): void {
		this._handle = null;
	}

	// ── Raw getters (for library integrations like ElevationAPI) ───

	getRawAltitudeFn = (): AltitudeFn | null => this._handle?.getAltitudeAtPosition ?? null;

	getRawHasDataFn = (): HasDataFn | null => this._handle?.hasDataAtPosition ?? null;

	getSetCacheCapacityFn = (): SetCacheCapacityFn | null => this._handle?.setCacheCapacity ?? null;

	getIsTileCachedFn = (): IsTileCachedFn | null => this._handle?.isTileCached ?? null;

	// ── Convenience queries (for thunks) ───────────────────────────

	/**
	 * Returns true if an HGT file exists that covers the given coordinate.
	 * Does not trigger a preload — only checks the filename index.
	 */
	hasDataAtPosition = async (lng: number, lat: number): Promise<boolean> => {
		if (!this._handle) return false;
		return this._handle.hasDataAtPosition(lng, lat);
	};

	/**
	 * Returns the elevation at the given coordinate, or null.
	 * Delegates to the library's retry-enabled getAltitudeAtPositionRetry
	 * (hasData check + exponential backoff up to ~3 s).
	 */
	getAltitudeAtPosition = async (lng: number, lat: number): Promise<number | null> => {
		if (!this._handle) {
			console.warn(
				'altitudeService.getAltitudeAtPosition: nativeNodeHandle not wired. ' +
					'RoutingMapView may not have mounted yet.'
			);
			return null;
		}
		return this._handle.getAltitudeAtPositionRetry(lng, lat);
	};
}

export const altitudeService = new AltitudeService();
