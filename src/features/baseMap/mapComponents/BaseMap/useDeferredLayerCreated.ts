/**
 * External dependencies
 */
import { useEffect, useRef } from 'react';

/**
 * Calls `onLayerCreated` once on mount, deferred by a macrotask
 * (`setTimeout(0)`) so the parent's `useEffect` (which adds the busy
 * key) fires first — React runs child effects before parent effects.
 *
 * Also calls `onLayerCreated` on unmount as a safety-net cleanup.
 *
 * The `didCreateRef` guard prevents double-firing in React Strict Mode.
 *
 * @param layerKey  - The layer key passed to the parent's busy-key tracker.
 * @param layerType - The layer type string (e.g. 'hillshading', 'online-raster-xyz').
 * @param onLayerCreated - Callback from the parent BaseMap.
 */
export function useDeferredLayerCreated(
	layerKey: string,
	layerType: string,
	onLayerCreated?: (layerKey: string, layerType: string) => void
): void {
	const didCreateRef = useRef(false);

	useEffect(() => {
		if (!didCreateRef.current) {
			didCreateRef.current = true;
			const timeoutId = setTimeout(() => onLayerCreated?.(layerKey, layerType), 0);
			return () => clearTimeout(timeoutId);
		}
	}, [
		onLayerCreated,
		layerKey,
		layerType,
	]);

	// Separate cleanup: remove key on unmount as safety net.
	useEffect(() => {
		return () => onLayerCreated?.(layerKey, layerType);
	}, [
		onLayerCreated,
		layerKey,
		layerType,
	]);
}
