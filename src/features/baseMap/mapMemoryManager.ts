/**
 * External dependencies
 */
import { AppState, type AppStateStatus } from 'react-native';
import { setNativeBufferPoolLimit } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { logError } from '../../lib/utils';
import { mapMemoryService } from '../../lib/MapMemoryService';
import { store } from '../../store/store';
import { selectMapsforgeGeneral } from './selectors';
import { selectIsRecording } from '../trackRecording/selectors';

/**
 * Background tile-cache memory manager (process-scoped, like
 * gnss/gnssModuleController).
 *
 * Android destroys hidden activities of memory-hungry apps under memory
 * pressure (`wm_destroy_activity … low-mem`) — straymap's map tile
 * caches (~hundreds of MB native heap + GL) made it the top reclaim
 * target.  The process survives (foreground service while recording)
 * but the activity dies and the UI remounts on return.
 *
 * This manager shrinks the in-memory tile caches while backgrounded:
 *
 * - Recording active: keep the last viewport warm for the configured
 *   timeout (short screen-offs stay instant), then prune to a
 *   viewport-sized budget.
 * - No recording: prune immediately — JS timers may be frozen without a
 *   foreground service, and there is nothing to return to quickly.
 * - Memory warning while backgrounded: clear everything as a last
 *   resort against the activity destroy.
 *
 * On-disk caches (mapsforge files, mbtiles, hillshading, downloaded
 * raster tiles) are never touched; the recording path (GNSS → DB) and
 * the GnssModule's separate DEM reader are unaffected.
 */

/** Per-layer tile budget — roughly one visible viewport of tiles. */
const PRUNE_BUDGET_TILES = 48;

/** Cap for vtm's NativeBufferPool (bytes kept pooled between frames). */
const NATIVE_BUFFER_POOL_MAX_BYTES = 16 * 1024 * 1024;

let initialized = false;
let appState: AppStateStatus = AppState.currentState;
let pruneTimer: ReturnType<typeof setTimeout> | null = null;

const cancelPruneTimer = (): void => {
	if (pruneTimer !== null) {
		clearTimeout(pruneTimer);
		pruneTimer = null;
	}
};

const pruneNow = (): void => {
	const handle = mapMemoryService.getHandle();
	if (!handle) {
		return;
	}
	handle.pruneTileMemoryCache(PRUNE_BUDGET_TILES).catch((err) => {
		logError('baseMap/mapMemoryManager.prune', err);
	});
};

const clearNow = (): void => {
	const handle = mapMemoryService.getHandle();
	if (!handle) {
		return;
	}
	handle.clearTileMemoryCache().catch((err) => {
		logError('baseMap/mapMemoryManager.clear', err);
	});
};

const schedulePrune = (): void => {
	cancelPruneTimer();
	const settings = selectMapsforgeGeneral(store.getState());
	if (!settings.backgroundPrune) {
		return;
	}
	const timeoutMin = Math.max(1, settings.backgroundPruneTimeoutMin);
	pruneTimer = setTimeout(() => {
		pruneTimer = null;
		pruneNow();
	}, timeoutMin * 60_000);
};

/**
 * Register the process-scoped AppState listeners.  Called from AppView
 * on every surface mount; the guard makes it a one-time registration
 * (listeners must survive activity re-creation).
 */
export const initMapMemoryManager = (): void => {
	if (initialized) {
		return;
	}
	initialized = true;

	// Bound vtm's peak-hold GL upload buffer pool (direct buffers live on
	// the Java heap on Android — a heap dump showed 58 MB pinned after
	// panning across regions). 16 MB matches vtm's own VBO budget
	// (BufferObject.LIMIT_BUFFERS); bigger uploads just re-allocate.
	setNativeBufferPoolLimit(NATIVE_BUFFER_POOL_MAX_BYTES).catch((err) => {
		logError('baseMap/mapMemoryManager.bufferPoolLimit', err);
	});

	AppState.addEventListener('change', (nextState) => {
		const wasBackground = appState === 'background';
		appState = nextState;

		if (nextState === 'background') {
			if (selectIsRecording(store.getState())) {
				schedulePrune();
			} else {
				pruneNow();
			}
		} else if (nextState === 'active' && wasBackground) {
			cancelPruneTimer();
		}
	});

	AppState.addEventListener('memoryWarning', () => {
		// Never clear the visible map; backgrounded only.
		if (appState === 'background') {
			clearNow();
		}
	});
};
