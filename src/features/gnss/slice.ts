/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { bearingBetween, haversineDistance } from '../../lib/formatting';
import { PALETTE_COLORS } from '../../constants';

/** Min movement away from the heading anchor (m) before the heading is
 * recomputed. Accumulates across fixes, so slow movement still updates
 * the direction every few fixes instead of never (per-fix distances at
 * walking pace are ~1-2 m and would drown in GPS noise). */
export const MIN_HEADING_MOVE_M = 5;
/** Max age of the heading anchor (ms). When older and the movement
 * threshold was never reached (stationary GPS drift), the anchor resets
 * to the current fix without changing the heading. */
export const HEADING_ANCHOR_MAX_AGE_MS = 10 * 1000;

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
export type GnssMarkerDirection = 'movingDirection' | 'north';

export interface GnssSettings {
	isActive: boolean;
	/** Center mode: keep the map centered on the GNSS position. */
	isCenterActive: boolean;
	/** Seconds of map stillness after a user pan before the map flies back
	 * to the GNSS position while center mode is active. */
	recenterDelaySec: number;
	/** Position-marker icon: the 'triangle' preset or an svg/png file/uri. */
	markerIconSource: string;
	/** Position-marker canvas size in dp. */
	markerSize: number;
	/** Position-marker fill color (preset triangle + accuracy circle). */
	markerColor: string;
	/** Position-marker direction: 'movingDirection' rotates the marker to
	 * the derived movement heading, 'north' keeps it pointing to map
	 * north (rotation 0). */
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
	/** Device compass azimuth (degrees 0-360 clockwise from magnetic
	 * north) from the native rotation-vector sensor — runtime only.
	 * Null until the first onDeviceAzimuth event, and on devices without
	 * the sensor. */
	deviceAzimuth: number | null;
}

export const initialSettings: GnssSettings = {
	isActive: false,
	isCenterActive: false,
	recenterDelaySec: 10,
	markerIconSource: 'triangle',
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
	deviceAzimuth: null,
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
				state.deviceAzimuth = null;
			}
		},
		setGnssPosition: (state, action: PayloadAction<GnssPositionData | null>) => {
			const next = action.payload;
			if (!next) {
				state.position = null;
				state.headingAnchor = null;
				state.heading = null;
				return;
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
		setDeviceAzimuth: (state, action: PayloadAction<number | null>) => {
			state.deviceAzimuth = action.payload;
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
	setDeviceAzimuth,
	setRecenterDelaySec,
	setMarkerIconSource,
	setMarkerSize,
	setMarkerColor,
	setMarkerDirection,
	setAccuracyCircleThresholdMeters,
	setShowMeasurementLabel,
} = gnssSlice.actions;

export default gnssSlice.reducer;
