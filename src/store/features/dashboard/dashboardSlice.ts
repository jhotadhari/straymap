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
import { DashboardElementSetting, DashboardItem, DashboardStyle } from './types';
import { selectEditItemKey } from './selectors';
import { AppThunk } from '../../store';
import { getSetterThunkWithGetter } from '../baseMap/utils';
import { arrayMoveMutable } from 'array-move';

export interface DashboardSettings {
	dashboardStyleTop: DashboardStyle;
	dashboardStyleBottom: DashboardStyle;
	itemsTop: DashboardItem<any>[];
	itemsBottom: DashboardItem<any>[];
}

export interface DashboardState extends SliceSettingsBase, DashboardSettings {
	isEditingDashboard: boolean;
	elementsSettings: { [key: string]: DashboardElementSetting };
	editItemKey?: string;
}

export const initialSettings: DashboardSettings = {
	dashboardStyleTop: {
		align: 'between',
		fontSize: 20,
	},
	dashboardStyleBottom: {
		align: 'between',
		fontSize: 20,
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
		},
	],
};

const initialState: DashboardState = {
	initialized: false,
	elementsSettings: {},
	isEditingDashboard: false,
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
		setElementsSettings: (state, action: PayloadAction<DashboardState['elementsSettings']>) => {
			state.elementsSettings = action.payload;
		},
		setIsEditingDashboard: (state, action: PayloadAction<boolean>) => {
			state.isEditingDashboard = action.payload;
		},
		setDashboardStyle: (
			state,
			action: PayloadAction<{
				position: string;
				style: DashboardStyle;
			}>
		) => {
			if ('top' === action.payload.position) {
				state.dashboardStyleTop = action.payload.style;
			}
			if ('bottom' === action.payload.position) {
				state.dashboardStyleBottom = action.payload.style;
			}
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
				// @ts-ignore	I'm sure its right!
				state.itemsTop = action.payload.items;
			}
			if ('bottom' === action.payload.position) {
				// @ts-ignore	I'm sure its right!
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
				// @ts-ignore	I'm sure its right!
				state.itemsTop = [...state.itemsTop, action.payload.item];
			}
			if ('bottom' === action.payload.position) {
				// @ts-ignore	I'm sure its right!
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
	setElementsSettings,
	setIsEditingDashboard,
	setDashboardStyle,
	setItems,
	addItem,
	removeItemKey,
	setEditItemKey: setEditItemKeyAction,
} = dashboardSlice.actions;

// Export the slice reducer for use in the store configuration
export default dashboardSlice.reducer;

export const setItem = (newItem: DashboardItem): AppThunk => {
	return (dispatch, getState) => {
		// const state = getState();
		let position;
		let newItems;
		let idx = getState().dashboard.itemsTop.findIndex((item) => item.key === newItem.key);
		if (-1 !== idx) {
			position = 'top';
			newItems = [...getState().dashboard.itemsTop];
		} else {
			idx = getState().dashboard.itemsBottom.findIndex((item) => item.key === newItem.key);
			position = 'bottom';
			newItems = [...getState().dashboard.itemsBottom];
		}
		if (!position || -1 === idx) {
			return;
		}
		newItems[idx] = newItem;
		dispatch(
			dashboardSlice.actions.setItems({
				position,
				items: newItems,
			})
		);
	};
};

export const moveItem = ({
	itemKey,
	direction,
}: {
	itemKey: string;
	direction: 'left' | 'right';
}): AppThunk => {
	return (dispatch, getState) => {
		let position;
		let newItems;
		let idx = getState().dashboard.itemsTop.findIndex((item) => item.key === itemKey);
		if (-1 !== idx) {
			position = 'top';
			newItems = [...getState().dashboard.itemsTop];
		} else {
			idx = getState().dashboard.itemsBottom.findIndex((item) => item.key === itemKey);
			position = 'bottom';
			newItems = [...getState().dashboard.itemsBottom];
		}
		if (!position || -1 === idx) {
			return;
		}
		if ('left' === direction && 0 === idx) {
			return;
		}
		if ('right' === direction && newItems.length - 1 === idx) {
			return;
		}
		arrayMoveMutable(newItems, idx, 'left' === direction ? idx - 1 : idx + 1);
		dispatch(
			dashboardSlice.actions.setItems({
				position,
				items: newItems,
			})
		);
	};
};

export const setEditItemKey = getSetterThunkWithGetter<DashboardState['editItemKey']>(
	selectEditItemKey,
	dashboardSlice.actions.setEditItemKey
);
