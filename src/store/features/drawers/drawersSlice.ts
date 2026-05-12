/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { without } from 'lodash-es';

export interface DrawersSettings {
	itemKeysLeft: string[];
	itemKeysRight: string[];
	controlHandleSide: string;
}

export interface DrawersState extends SliceSettingsBase, DrawersSettings {
	activeKeyLeft?: string;
	activeKeyRight?: string;
}

export const initialSettings: DrawersSettings = {
	itemKeysLeft: [
		'position',
		'tracksRoutes',
		'waypoints',
	],
	itemKeysRight: [
		'maps',
		'searchPlace',
		'brouter',
	],
	controlHandleSide: 'right',
};

const initialState: DrawersState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const drawersSlice = createSlice({
	name: 'drawers',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setControlHandleSide: (state, action: PayloadAction<DrawersState['controlHandleSide']>) => {
			console.log('debug action.payload', action.payload); // debug
			state.controlHandleSide = action.payload;
		},
		setItemKeys: (
			state,
			action: PayloadAction<{
				side: string;
				itemKeys: string[];
			}>
		) => {
			if ('left' === action.payload.side) {
				state.itemKeysLeft = action.payload.itemKeys;
			}
			if ('right' === action.payload.side) {
				state.itemKeysRight = action.payload.itemKeys;
			}
		},
		addItemKey: (
			state,
			action: PayloadAction<{
				side: string;
				itemKey: string;
			}>
		) => {
			if ('left' === action.payload.side) {
				state.itemKeysLeft = [...state.itemKeysLeft, action.payload.itemKey];
			}
			if ('right' === action.payload.side) {
				state.itemKeysRight = [...state.itemKeysRight, action.payload.itemKey];
			}
		},
		removeItemKey: (
			state,
			action: PayloadAction<{
				side: string;
				itemKey: string;
			}>
		) => {
			if ('left' === action.payload.side) {
				state.itemKeysLeft = without(state.itemKeysLeft, action.payload.itemKey);
				if (state.activeKeyLeft === action.payload.itemKey) {
					state.activeKeyLeft = undefined;
				}
			}
			if ('right' === action.payload.side) {
				state.itemKeysRight = without(state.itemKeysRight, action.payload.itemKey);
				if (state.activeKeyRight === action.payload.itemKey) {
					state.activeKeyRight = undefined;
				}
			}
		},
		setActiveKey: (
			state,
			action: PayloadAction<{
				side: string;
				activeKey?: string;
			}>
		) => {
			if ('left' === action.payload.side) {
				state.activeKeyLeft = action.payload.activeKey;
			}
			if ('right' === action.payload.side) {
				state.activeKeyRight = action.payload.activeKey;
			}
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setControlHandleSide,
	setItemKeys,
	addItemKey,
	removeItemKey,
	setActiveKey,
} = drawersSlice.actions;

// Export the slice reducer for use in the store configuration
export default drawersSlice.reducer;
