/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

/**
 * Internal dependencies
*/
import { SliceSettingsBase } from '../../../types';
import { uniq } from 'lodash-es';

export interface UiSettings {
	expandedElements: string[];
}

export interface UiState extends SliceSettingsBase, UiSettings {
	busyKeys: string[];
}

export const initialSettings : UiSettings = {
	expandedElements: [],
};

const initialState: UiState = {
	initialized: false,
	busyKeys: [],
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setExpandedElements: (state, action: PayloadAction<string[]>) => {
			state.expandedElements = action.payload;
		},
		setElementExpanded: (state, action: PayloadAction<{
			key: string;
			expanded: boolean;
		}>) => {
			let newExpandedElements = [...state.expandedElements];
			if ( action.payload.expanded ) {
				newExpandedElements.push( action.payload.key );
			} else {
				newExpandedElements = newExpandedElements.filter( key => action.payload.key !== key );
			}
			state.expandedElements = uniq( newExpandedElements );
		},
		setBusyKeys: (state, action: PayloadAction<string[]>) => {
			state.busyKeys = action.payload;
		},
		addBusyKey: (state, action: PayloadAction<string>) => {
			if ( ! state.busyKeys.includes( action.payload ) ) {
				state.busyKeys = [
					...state.busyKeys,
					action.payload,
				];
			}
		},
		removeBusyKey: (state, action: PayloadAction<string>) => {
			if ( state.busyKeys.includes( action.payload ) ) {
				state.busyKeys = state.busyKeys.filter( key => action.payload !== key );
			}
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setExpandedElements,
	setElementExpanded,
	setBusyKeys,
	addBusyKey,
	removeBusyKey,
} = uiSlice.actions;

// Export the slice reducer for use in the store configuration
export default uiSlice.reducer;
