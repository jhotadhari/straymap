/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { without } from 'lodash-es';

export interface BottomDrawerSettings {
	itemKeys: string[];
	activeKey?: string;
}

export interface BottomDrawersState extends SliceSettingsBase, BottomDrawerSettings {}

export const initialSettings: BottomDrawerSettings = {
	itemKeys: ['example'],
	activeKey: undefined,
};

const initialState: BottomDrawersState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const bottomDrawerSlice = createSlice({
	name: 'bottomDrawer',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setItemKeys: (state, action: PayloadAction<string[]>) => {
			state.itemKeys = action.payload;
		},
		addItemKey: (state, action: PayloadAction<string>) => {
			state.itemKeys = [...state.itemKeys, action.payload];
		},
		removeItemKey: (state, action: PayloadAction<string>) => {
			state.itemKeys = without(state.itemKeys, action.payload);
			if (state.activeKey === action.payload) {
				state.activeKey = undefined;
			}
		},
		setActiveKey: (state, action: PayloadAction<string | undefined>) => {
			if (!action.payload || state.itemKeys.includes(action.payload)) {
				state.activeKey = action.payload;
			}
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setItemKeys, addItemKey, removeItemKey, setActiveKey } =
	bottomDrawerSlice.actions;

// Export the slice reducer for use in the store configuration
export default bottomDrawerSlice.reducer;
