/**
 * Singleton registry that bridges the map's nativeNodeHandle to
 * non-React code via the library's {@link createMapHandleRegistry}.
 *
 * AppView wires the handle on mount / unwires on unmount.
 * Downstream callers use {@link requireHandle} or
 * {@link getHandle} to obtain the full map-control + elevation API.
 */

/**
 * External dependencies
 */
import { createMapHandleRegistry, type MapHandleRegistry } from 'react-native-mapsforge-vtm';

export const altitudeService: MapHandleRegistry = createMapHandleRegistry();
export type { MapHandleRegistry };
