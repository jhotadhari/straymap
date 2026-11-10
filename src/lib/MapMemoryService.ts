/**
 * External dependencies
 */
import { createMapHandleRegistry, type MapHandleRegistry } from 'react-native-mapsforge-vtm';

/**
 * Module-level registry holding the current map handle, wired from
 * AppView whenever the map view (re)mounts — same pattern as
 * AltitudeService.  Consumers outside the React tree (the
 * baseMap/mapMemoryManager) resolve the handle here to prune/clear the
 * in-memory tile caches.
 */
export const mapMemoryService: MapHandleRegistry = createMapHandleRegistry();
