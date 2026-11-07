/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { bearingBetween, deriveSpeedMps, haversineDistance } from '../../lib/formatting';
import { PALETTE_COLORS } from '../../constants';

/** Min movement away from the heading anchor (m) before the heading is
 * recomputed. Accumulates across fixes, so slow movement still updates
 * the direction every few fixes instead of never (per-fix distances at
 * walking pace are ~1-2 m and would drown in GPS noise). */
export const MIN_HEADING_MOVE_M = 2;
/** Max age of the heading anchor (ms). When older and the movement
 * threshold was never reached (stationary GPS drift), the anchor resets
 * to the current fix without changing the heading. */
export const HEADING_ANCHOR_MAX_AGE_MS = 10 * 1000;

/** Reported speed at or below this is treated as "no reported speed"
 * for the derived-speed fallback (m/s). */
export const REPORTED_SPEED_EPSILON_MPS = 0.5;
/** Derived speed clearly above this (m/s) while the reported speed is
 * at or below epsilon votes for the fallback — covers sources that move
 * positions without reporting a speed (GPS spoofers).  Low enough that
 * slow-but-steady spoofed movement (e.g. 3 m per 1.5 s ≈ 2 m/s) engages
 * via the debounce; stationary GPS jitter never sustains it. */
export const DERIVED_SPEED_FALLBACK_MIN_MPS = 1.5;
/** Consecutive qualifying fixes required before the fallback engages —
 * debounce: single-fix GPS jitter spikes don't sustain this. */
export const FALLBACK_ENGAGE_VOTES = 5;
/** Reported speed above this (m/s) exits the fallback immediately —
 * the source is reporting real speed again. */
export const FALLBACK_EXIT_RAW_MPS = 1;
/** Consecutive fixes without clear derived movement required to exit
 * the fallback while the reported speed stays near zero. */
export const FALLBACK_EXIT_VOTES = 3;

/** Live GNSS position data.  `altitude` is always the raw GNSS fix
 * (independent of the recording filter's DEM resolution), so live
 * altitude displays never show DEM elevation. */
export interface GnssPositionData {
	lng: number;
	lat: number;
	altitude: number | null;
	/** Android velocity bearing — unreliable for pedestrian fixes (often
	 * -1); consumers should use the slice's derived heading instead. */
	bearing: number;
	accuracy: number;
	speed: number;
	timestamp: number;
}

/** Position-marker direction mode. */
export type GnssMarkerDirection = 'movingDirection' | 'compass';

export interface GnssSettings {
	isActive: boolean;
	/** Center mode: keep the map centered on the GNSS position. */
	isCenterActive: boolean;
	/** Seconds of map stillness after a user pan before the map flies back
	 * to the GNSS position while center mode is active. */
	recenterDelaySec: number;
	/** Position-marker icon: a built-in preset (navigation arrows) or an svg/png file/uri. */
	markerIconSource: string;
	/** Position-marker canvas size in dp. */
	markerSize: number;
	/** Position-marker fill color (preset triangle + accuracy circle). */
	markerColor: string;
	/** Position-marker direction: 'movingDirection' rotates the marker to
	 * the derived movement heading (course over ground), 'compass' turns
	 * it with the device compass bearing. */
	markerDirection: GnssMarkerDirection;
	/** Accuracy-circle threshold (m). The circle is drawn with the live
	 * accuracy radius only while the accuracy is WORSE than this value;
	 * 0 disables the circle entirely. */
	accuracyCircleThresholdMeters: number;
	/** Whether the center-mode measurement label (distance/bearing) is
	 * shown while panned away from the GNSS position. */
	showMeasurementLabel: boolean;
}

export interface GnssState extends SliceSettingsBase, GnssSettings {
	/** Live position — runtime only, never persisted. Null until the
	 * first onGnssPosition event, and reset to null when GNSS turns off. */
	position: GnssPositionData | null;
	/** Reference fix for the heading derivation — runtime only. */
	headingAnchor: { lng: number; lat: number; timestamp: number } | null;
	/** Movement direction (degrees 0-360) resolved from the heading
	 * anchor, movement-gated (MIN_HEADING_MOVE_M). Runtime only. */
	heading: number | null;
	/** Previous live fix — basis for the derived speed. Runtime only. */
	prevFix: { lng: number; lat: number; timestamp: number } | null;
	/** Speed (m/s) derived from consecutive live fixes — independent of
	 * the payload's reported speed field (which some sources, e.g. GPS
	 * spoofers, leave near zero).  Null until the second fix. Runtime
	 * only. */
	derivedSpeed: number | null;
	/** Derived-speed fallback latch: engaged with debounce (consecutive
	 * qualifying fixes) and released with hysteresis (raw speed clearly
	 * recovers, or derived movement stops). Runtime only. */
	speedFallbackActive: boolean;
	/** Consecutive-fix counter for the fallback latch (both the engage
	 * and the exit debounce — the phases are mutually exclusive).
	 * Runtime only. */
	fallbackVotes: number;
}

export const initialSettings: GnssSettings = {
	isActive: false,
	isCenterActive: false,
	recenterDelaySec: 10,
	markerIconSource: 'materialNavigation',
	markerSize: 26,
	// The first red of the color-palette options (ColorPaletteInline).
	markerColor: PALETTE_COLORS[0].bg,
	markerDirection: 'movingDirection',
	accuracyCircleThresholdMeters: 10,
	showMeasurementLabel: true,
};

const initialState: GnssState = {
	initialized: false,
	...initialSettings,
	position: null,
	headingAnchor: null,
	heading: null,
	prevFix: null,
	derivedSpeed: null,
	speedFallbackActive: false,
	fallbackVotes: 0,
};

export const gnssSlice = createSlice({
	name: 'gnss',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setIsActive: (state, action: PayloadAction<boolean>) => {
			state.isActive = action.payload;
			if (!action.payload) {
				state.position = null;
				state.headingAnchor = null;
				state.heading = null;
				state.prevFix = null;
				state.derivedSpeed = null;
				state.speedFallbackActive = false;
				state.fallbackVotes = 0;
			}
		},
		setGnssPosition: (state, action: PayloadAction<GnssPositionData | null>) => {
			const next = action.payload;
			if (!next) {
				state.position = null;
				state.headingAnchor = null;
				state.heading = null;
				state.prevFix = null;
				state.derivedSpeed = null;
				state.speedFallbackActive = false;
				state.fallbackVotes = 0;
				return;
			}
			// Derived speed from consecutive live fixes — the reported
			// speed field is Doppler-based and unreliable for some
			// sources (pedestrian fixes, GPS spoofers that only move
			// positions).  Null on the first fix / unusable intervals.
			state.derivedSpeed = state.prevFix
				? deriveSpeedMps(
						{
							lng: state.prevFix.lng,
							lat: state.prevFix.lat,
							timestamp: state.prevFix.timestamp,
						},
						{ lng: next.lng, lat: next.lat, timestamp: next.timestamp }
					)
				: null;
			state.prevFix = { lng: next.lng, lat: next.lat, timestamp: next.timestamp };

			// Speed-fallback latch: a per-fix binary switch between the
			// reported and the derived speed oscillates at slow speeds
			// (reported ~0 while position jitter occasionally spikes the
			// derived value).  Instead, engage only after consecutive
			// qualifying fixes, and release only when the reported speed
			// clearly recovers or the derived movement stops.
			const rawSpeed = next.speed;
			const derived = state.derivedSpeed;
			if (state.speedFallbackActive) {
				if (rawSpeed > FALLBACK_EXIT_RAW_MPS) {
					state.speedFallbackActive = false;
					state.fallbackVotes = 0;
				} else if (derived == null || derived <= DERIVED_SPEED_FALLBACK_MIN_MPS) {
					state.fallbackVotes += 1;
					if (state.fallbackVotes >= FALLBACK_EXIT_VOTES) {
						state.speedFallbackActive = false;
						state.fallbackVotes = 0;
					}
				} else {
					state.fallbackVotes = 0;
				}
			} else if (
				rawSpeed <= REPORTED_SPEED_EPSILON_MPS &&
				derived != null &&
				derived > DERIVED_SPEED_FALLBACK_MIN_MPS
			) {
				state.fallbackVotes += 1;
				if (state.fallbackVotes >= FALLBACK_ENGAGE_VOTES) {
					state.speedFallbackActive = true;
					state.fallbackVotes = 0;
				}
			} else {
				state.fallbackVotes = 0;
			}

			const anchor = state.headingAnchor;
			if (!anchor) {
				state.headingAnchor = { lng: next.lng, lat: next.lat, timestamp: next.timestamp };
			} else {
				const dist = haversineDistance([anchor.lng, anchor.lat], [next.lng, next.lat]);
				if (dist >= MIN_HEADING_MOVE_M) {
					// Movement direction from the anchor — the payload's
					// velocity bearing is unreliable.
					state.heading = bearingBetween([anchor.lng, anchor.lat], [next.lng, next.lat]);
					state.headingAnchor = {
						lng: next.lng,
						lat: next.lat,
						timestamp: next.timestamp,
					};
				} else if (next.timestamp - anchor.timestamp >= HEADING_ANCHOR_MAX_AGE_MS) {
					// Below the threshold the bearing is GPS noise — but a
					// stale anchor would eventually cross it via stationary
					// drift. Reset it without changing the heading.
					state.headingAnchor = {
						lng: next.lng,
						lat: next.lat,
						timestamp: next.timestamp,
					};
				}
			}
			state.position = next;
		},
		setIsCenterActive: (state, action: PayloadAction<boolean>) => {
			state.isCenterActive = action.payload;
		},
		setRecenterDelaySec: (state, action: PayloadAction<number>) => {
			state.recenterDelaySec = action.payload;
		},
		setMarkerIconSource: (state, action: PayloadAction<string>) => {
			state.markerIconSource = action.payload;
		},
		setMarkerSize: (state, action: PayloadAction<number>) => {
			state.markerSize = action.payload;
		},
		setMarkerColor: (state, action: PayloadAction<string>) => {
			state.markerColor = action.payload;
		},
		setMarkerDirection: (state, action: PayloadAction<GnssMarkerDirection>) => {
			state.markerDirection = action.payload;
		},
		setAccuracyCircleThresholdMeters: (state, action: PayloadAction<number>) => {
			state.accuracyCircleThresholdMeters = action.payload;
		},
		setShowMeasurementLabel: (state, action: PayloadAction<boolean>) => {
			state.showMeasurementLabel = action.payload;
		},
	},
});

export const {
	setInitialized,
	setIsActive,
	setGnssPosition,
	setIsCenterActive,
	setRecenterDelaySec,
	setMarkerIconSource,
	setMarkerSize,
	setMarkerColor,
	setMarkerDirection,
	setAccuracyCircleThresholdMeters,
	setShowMeasurementLabel,
} = gnssSlice.actions;

export default gnssSlice.reducer;
