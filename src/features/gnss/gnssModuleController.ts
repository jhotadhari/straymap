/**
 * External dependencies
 */
import { DeviceEventEmitter } from 'react-native';
import { GnssModule, type GnssPosition } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { store } from '../../store/store';
import { logError } from '../../lib/utils';
import { setGnssPosition } from './slice';
import { writeGnssPosition } from '../trackRecording/slice';

/**
 * Process-scoped GNSS lifecycle controller.
 *
 * The native GnssModule (application-level, not view-level) owns the
 * location listener. This controller decides WHEN it runs — one place,
 * process-scoped, independent of any component:
 *
 * - Runs while GNSS is active or a recording (or a pending resume) is
 *   active — but ONLY while the map surface is present, unless a
 *   recording/resume keeps it alive (background track recording after
 *   an accidental swipe; battery-safe otherwise).
 * - Feeds the gnss slice's live position (onGnssLive) and the
 *   track-recording listener (onGnssPosition) via Redux dispatches —
 *   the write listener itself gates on isRecording/resumePending.
 * - Clears the stale position when the listener stops.
 * - Configures the module's DEM source from the global hgtDirPath.
 */

/** Relaxed gate for plain GNSS activation (no recording). The recording
 * filter (stricter) applies while recording or resuming. */
const GNSS_IDLE_FILTER: GnssFilterConfig = {
	minDistanceMeters: 0,
	minTimeSec: 1,
	minAccuracyMeters: 100,
	provider: 'satellite',
	altitudeSource: 'dem-preferred',
};

export interface GnssFilterConfig {
	minDistanceMeters: number;
	minTimeSec: number;
	minAccuracyMeters: number;
	provider: 'satellite';
	altitudeSource: 'dem-preferred' | 'gnss-only';
}

export interface GnssControllerState {
	gnssIsActive: boolean;
	isRecording: boolean;
	resumePending: boolean;
	surfacePresent: boolean;
	minDistance: number;
	minTime: number;
	minPrecision: number;
	useDemAltitude: boolean;
}

/**
 * Pure rule: which filter the module should run with (null = stop).
 * Extracted for unit tests.
 */
export const resolveGnssFilter = (s: GnssControllerState): GnssFilterConfig | null => {
	const recording = s.isRecording || s.resumePending;
	const wantActive = (s.gnssIsActive || recording) && (s.surfacePresent || recording);
	if (!wantActive) {
		return null;
	}
	if (recording) {
		return {
			minDistanceMeters: s.minDistance,
			minTimeSec: s.minTime,
			minAccuracyMeters: s.minPrecision,
			provider: 'satellite',
			altitudeSource: s.useDemAltitude ? 'dem-preferred' : 'gnss-only',
		};
	}
	return GNSS_IDLE_FILTER;
};

let surfacePresent = false;
let lastFilterJson: string | null = null;
let lastHgtDirPath: string | null = null;

/**
 * Called by the app shell when the map surface mounts/unmounts. Flipping
 * this re-evaluates the filter: a recording keeps GNSS alive without a
 * surface; plain GNSS-on stops with it.
 */
export const setSurfacePresent = (present: boolean): void => {
	surfacePresent = present;
	sync();
};

const sync = (): void => {
	const state = store.getState();
	const { gnss, trackRecording } = state;

	const filter = resolveGnssFilter({
		gnssIsActive: gnss.isActive,
		isRecording: trackRecording.isRecording,
		resumePending: trackRecording.resumePending,
		surfacePresent,
		minDistance: trackRecording.minDistance,
		minTime: trackRecording.minTime,
		minPrecision: trackRecording.minPrecision,
		useDemAltitude: trackRecording.useDemAltitude,
	});

	// Diff before calling into the module — every setFilter restarts the
	// native listener, and the store subscribes every dispatch (events
	// included), so this must be a no-op when nothing changed.
	const filterJson = JSON.stringify(filter);
	if (filterJson !== lastFilterJson) {
		lastFilterJson = filterJson;
		try {
			GnssModule.setFilter(filter as GnssFilterConfig | null);
		} catch (err) {
			logError('gnss/gnssModuleController.setFilter', err);
		}
		if (filter == null) {
			store.dispatch(setGnssPosition(null));
		}
	}

	// DEM source for the module's altitude resolution — the same global
	// hgtDirPath the map uses. The module owns its own reader slot.
	const hgtDirPath = state.baseMap.hgtDirPath ?? null;
	if (hgtDirPath !== lastHgtDirPath) {
		lastHgtDirPath = hgtDirPath;
		try {
			GnssModule.setHgtDirPath(hgtDirPath);
		} catch (err) {
			logError('gnss/gnssModuleController.setHgtDirPath', err);
		}
	}
};

const handleGnssLive = (payload: GnssPosition): void => {
	// Live display always uses the raw GNSS altitude — the DEM toggle
	// only affects what is stored, not what is shown.
	store.dispatch(
		setGnssPosition({
			lng: payload.lng,
			lat: payload.lat,
			altitude: payload.gnssAltitude,
			bearing: payload.bearing,
			accuracy: payload.accuracy,
			speed: payload.speed,
			timestamp: payload.timestamp,
		})
	);
};

const handleGnssPosition = (payload: GnssPosition): void => {
	// The recording write listener gates on isRecording/resumePending
	// itself — this dispatch is the only path to it now.
	store.dispatch(writeGnssPosition(payload));
};

let initialized = false;

/**
 * Register the process-scoped event subscriptions + the store listener.
 * Called once from the gnss feature registration (module scope of
 * features/gnss/index.ts — after the store exists).
 */
export const initGnssModuleController = (): void => {
	if (initialized) {
		return;
	}
	initialized = true;
	DeviceEventEmitter.addListener('onGnssLive', handleGnssLive);
	DeviceEventEmitter.addListener('onGnssPosition', handleGnssPosition);
	store.subscribe(sync);
	sync();
};
