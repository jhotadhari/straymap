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

/** Min movement between two fixes (m) before the heading is recomputed.
 * Below this the bearing is pure GPS noise — keep the previous heading. */
export const MIN_HEADING_MOVE_M = 3;

/** Live GNSS position data — mirrors the native onGnssPosition payload. */
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

export interface GnssSettings {
	isActive: boolean;
	/** Center mode: keep the map centered on the GNSS position. */
	isCenterActive: boolean;
	/** Seconds of map stillness after a user pan before the map flies back
	 * to the GNSS position while center mode is active. */
	recenterDelaySec: number;
}

export interface GnssState extends SliceSettingsBase, GnssSettings {
	/** Live position — runtime only, never persisted. Null until the
	 * first onGnssPosition event, and reset to null when GNSS turns off. */
	position: GnssPositionData | null;
	/** Previous fix's coordinates — runtime only; feeding the heading. */
	lastPosition: { lng: number; lat: number } | null;
	/** Movement direction (degrees 0-360) resolved from the last two
	 * fixes, movement-gated (MIN_HEADING_MOVE_M). Runtime only. */
	heading: number | null;
}

export const initialSettings: GnssSettings = {
	isActive: false,
	isCenterActive: false,
	recenterDelaySec: 10,
};

const initialState: GnssState = {
	initialized: false,
	...initialSettings,
	position: null,
	lastPosition: null,
	heading: null,
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
				state.lastPosition = null;
				state.heading = null;
			}
		},
		setGnssPosition: (state, action: PayloadAction<GnssPositionData | null>) => {
			const next = action.payload;
			if (!next) {
				state.position = null;
				state.lastPosition = null;
				state.heading = null;
				return;
			}
			const prev = state.lastPosition;
			if (prev) {
				const dist = haversineDistance([prev.lng, prev.lat], [next.lng, next.lat]);
				if (dist >= MIN_HEADING_MOVE_M) {
					// Movement direction from the last two positions —
					// the payload's velocity bearing is unreliable.
					state.heading = bearingBetween([prev.lng, prev.lat], [next.lng, next.lat]);
				}
				// Below the threshold the bearing is GPS noise — keep the
				// previous heading.
			}
			state.lastPosition = { lng: next.lng, lat: next.lat };
			state.position = next;
		},
		setIsCenterActive: (state, action: PayloadAction<boolean>) => {
			state.isCenterActive = action.payload;
		},
		setRecenterDelaySec: (state, action: PayloadAction<number>) => {
			state.recenterDelaySec = action.payload;
		},
	},
});

export const {
	setInitialized,
	setIsActive,
	setGnssPosition,
	setIsCenterActive,
	setRecenterDelaySec,
} = gnssSlice.actions;

export default gnssSlice.reducer;
