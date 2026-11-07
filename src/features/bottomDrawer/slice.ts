/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../types';
import { AppThunk } from '../../store/store';
import { without } from 'lodash-es';

export interface BottomDrawerSettings {
	itemKeys: string[];
	activeKey?: string;
}

export interface BottomDrawersState extends SliceSettingsBase, BottomDrawerSettings {}

export const initialSettings: BottomDrawerSettings = {
	itemKeys: [],
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
			// No itemKeys guard here: the active key may be a derived key
			// (e.g. `chart:routing`) that isn't part of the raw
			// itemKeys list. Stale keys are filtered/handled by the UI layer
			// (selectItemKeys + effectiveActiveItemKey fallback).
			state.activeKey = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const { setInitialized, setItemKeys, addItemKey, removeItemKey, setActiveKey } =
	bottomDrawerSlice.actions;

/**
 * Called when the database path changes (dbLoader `setDbPath` thunk
 * dispatches every feature's `onSetDbPath` hook).  The active key can
 * embed a line id (chart source key like `chart:line:<id>`, persisted
 * via the auto-activation listeners) — clear it so the drawer doesn't
 * re-open with a dead chart key against the new database.  `itemKeys`
 * needs no clearing: chart entries are derived by the selectors and
 * filtered against the item resolvers (see chart feature), so stale
 * persisted keys never produce broken drawer entries.
 */
export const onSetDbPath = (): AppThunk => (dispatch) => {
	dispatch(setActiveKey(undefined));
};

// Export the slice reducer for use in the store configuration
export default bottomDrawerSlice.reducer;
