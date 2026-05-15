/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import { SliceSettingsBase } from '../../../types';
import { DashboardItem, DashboardStyle } from './types';
import { selectEditItemKey, selectItemByKey } from './selectors';
import { AppThunk } from '../../store';
import { getSetterThunkWithGetter } from '../baseMap/utils';

export interface DashboardSettings {
	// elements: DashboardItem[];
	dashboardStyle: DashboardStyle;

	itemsTop: DashboardItem[];
	itemsBottom: DashboardItem[];
}

export interface DashboardState extends SliceSettingsBase, DashboardSettings {
	editItemKey?: string;
}

export const initialSettings: DashboardSettings = {
	// elements: [
	// 	{
	// 		elementType: 'zoomLevel',
	// 		key: rnUuid.v4(),
	// 	},
	// 	{
	// 		elementType: 'centerCoordinates',
	// 		key: rnUuid.v4(),
	// 		options: {
	// 			unit: {
	// 				key: 'default',
	// 				round: 4,
	// 			},
	// 		},
	// 	},
	// ],
	dashboardStyle: {
		align: 'top',
		fontSize: 14,
	},

	itemsTop: [],
	itemsBottom: [
		{
			elementType: 'zoomLevel',
			key: rnUuid.v4(),
		},
		{
			elementType: 'centerCoordinates',
			key: rnUuid.v4(),
			// options: {
			// 	unit: {
			// 		key: 'default',
			// 		round: 4,
			// 	},
			// },
		},
	],
};

const initialState: DashboardState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const dashboardSlice = createSlice({
	name: 'dashboard',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setElements: (state, action: PayloadAction<any>) => {
			// ??? delete this
		},
		setDashboardStyle: (state, action: PayloadAction<DashboardSettings['dashboardStyle']>) => {
			state.dashboardStyle = action.payload;
		},

		setItems: (
			// ??? should be thunk
			state,
			action: PayloadAction<{
				position: string;
				items: DashboardItem[];
			}>
		) => {
			if ('top' === action.payload.position) {
				state.itemsTop = action.payload.items;
			}
			if ('bottom' === action.payload.position) {
				state.itemsBottom = action.payload.items;
			}
		},
		addItem: (
			state,
			action: PayloadAction<{
				position: string;
				item: DashboardItem;
			}>
		) => {
			if ('top' === action.payload.position) {
				state.itemsTop = [...state.itemsTop, action.payload.item];
			}
			if ('bottom' === action.payload.position) {
				state.itemsBottom = [...state.itemsBottom, action.payload.item];
			}
		},
		removeItemKey: (
			state,
			action: PayloadAction<{
				position: string;
				itemKey: string;
			}>
		) => {
			if ('top' === action.payload.position) {
				state.itemsTop = state.itemsTop.filter(
					(item) => item.key !== action.payload.itemKey
				);
			}
			if ('bottom' === action.payload.position) {
				state.itemsBottom = state.itemsBottom.filter(
					(item) => item.key !== action.payload.itemKey
				);
			}
		},
		setEditItemKey: (state, action: PayloadAction<string | undefined>) => {
			state.editItemKey = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setElements,
	setDashboardStyle,
	setItems,
	addItem,
	removeItemKey,
	setEditItemKey: setEditItemKeyAction,
} = dashboardSlice.actions;

// Export the slice reducer for use in the store configuration
export default dashboardSlice.reducer;

export const setItem = (
	newItem: DashboardItem,
): AppThunk => {
	return (dispatch, getState) => {
		// const state = getState();
		let position;
		let newItems;
		let idx = getState().dashboard.itemsTop.findIndex((item) => item.key === newItem.key);
		if (-1 !== idx ) {
			position = 'top';
			newItems = [...getState().dashboard.itemsTop];
		} else {
			idx = getState().dashboard.itemsBottom.findIndex((item) => item.key === newItem.key);
			position = 'bottom';
			newItems = [...getState().dashboard.itemsBottom];
		}
		if (! position || -1 === idx) {
			return;
		}
		newItems[idx] = newItem;
		dispatch( dashboardSlice.actions.setItems( {
			position,
			items: newItems,
		} ) );
	};
};

export const setEditItemKey = getSetterThunkWithGetter<
	DashboardState['editItemKey']
>(selectEditItemKey, dashboardSlice.actions.setEditItemKey);
