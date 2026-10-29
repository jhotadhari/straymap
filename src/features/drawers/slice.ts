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
import { SETTINGS_HANDLE_KEY } from './constants';
import { DrawerSide } from './types';

export interface DrawersSettings {
	itemKeysLeft: string[];
	itemKeysRight: string[];
	itemKeysAvailable: string[];
	sortable: boolean;
	activeKeyLeft?: string;
	activeKeyRight?: string;
}

export interface DrawersState extends SliceSettingsBase, DrawersSettings {}

export const initialSettings: DrawersSettings = {
	itemKeysLeft: [
		'lines',
	],
	itemKeysRight: [
		'maps',
		'routing',
		'tracking',
	],
	itemKeysAvailable: [
		SETTINGS_HANDLE_KEY,
	],
	sortable: false,
	activeKeyLeft: 'lines',
	activeKeyRight: 'maps',
};

const initialState: DrawersState = {
	initialized: false,
	...initialSettings,
};

const getItemKeysForSide = (state: DrawersState, side: DrawerSide): string[] => {
	if ('left' === side) {
		return state.itemKeysLeft;
	}
	if ('right' === side) {
		return state.itemKeysRight;
	}
	return state.itemKeysAvailable;
};

const setItemKeysForSide = (state: DrawersState, side: DrawerSide, itemKeys: string[]) => {
	if ('left' === side) {
		state.itemKeysLeft = itemKeys;
	} else if ('right' === side) {
		state.itemKeysRight = itemKeys;
	} else {
		state.itemKeysAvailable = itemKeys;
	}
};

const getSideForKey = (state: DrawersState, itemKey: string): DrawerSide | undefined => {
	if (state.itemKeysLeft.includes(itemKey)) {
		return 'left';
	}
	if (state.itemKeysRight.includes(itemKey)) {
		return 'right';
	}
	if (state.itemKeysAvailable.includes(itemKey)) {
		return 'available';
	}
	return undefined;
};

const moveItemKeyState = (
	state: DrawersState,
	itemKey: string,
	side: DrawerSide,
	index: number
) => {
	const currentSide = getSideForKey(state, itemKey);
	if (!currentSide) {
		return;
	}
	if (currentSide === side) {
		const itemKeys = getItemKeysForSide(state, side);
		const newItemKeys = without(itemKeys, itemKey);
		const targetIndex = Math.max(0, Math.min(index, newItemKeys.length));
		newItemKeys.splice(targetIndex, 0, itemKey);
		setItemKeysForSide(state, side, newItemKeys);
		return;
	}
	const currentItemKeys = without(getItemKeysForSide(state, currentSide), itemKey);
	setItemKeysForSide(state, currentSide, currentItemKeys);
	if ('left' === currentSide && state.activeKeyLeft === itemKey) {
		state.activeKeyLeft = undefined;
	}
	if ('right' === currentSide && state.activeKeyRight === itemKey) {
		state.activeKeyRight = undefined;
	}
	const targetItemKeys = getItemKeysForSide(state, side);
	const targetIndex = Math.max(0, Math.min(index, targetItemKeys.length));
	targetItemKeys.splice(targetIndex, 0, itemKey);
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
		setSortable: (state, action: PayloadAction<boolean>) => {
			state.sortable = action.payload;
		},
		setItemKeys: (
			state,
			action: PayloadAction<{
				side: DrawerSide;
				itemKeys: string[];
			}>
		) => {
			setItemKeysForSide(state, action.payload.side, action.payload.itemKeys);
		},
		moveItemKey: (
			state,
			action: PayloadAction<{
				itemKey: string;
				side: DrawerSide;
				index: number;
			}>
		) => {
			const { itemKey, side, index } = action.payload;
			moveItemKeyState(state, itemKey, side, index);
		},
		toggleItemKeySide: (
			state,
			action: PayloadAction<{
				itemKey: string;
				side: 'left' | 'right';
			}>
		) => {
			const { itemKey, side } = action.payload;
			const isOnSide = getItemKeysForSide(state, side).includes(itemKey);
			if (isOnSide) {
				moveItemKeyState(state, itemKey, 'available', 0);
			} else {
				moveItemKeyState(state, itemKey, side, Infinity);
			}
		},
		setActiveKey: (
			state,
			action: PayloadAction<{
				side?: string;
				activeKey?: string;
			}>
		) => {
			if (action.payload.side) {
				if (
					'left' === action.payload.side &&
					(!action.payload.activeKey ||
						state.itemKeysLeft.includes(action.payload.activeKey))
				) {
					state.activeKeyLeft = action.payload.activeKey;
				} else if (
					'right' === action.payload.side &&
					(!action.payload.activeKey ||
						state.itemKeysRight.includes(action.payload.activeKey))
				) {
					state.activeKeyRight = action.payload.activeKey;
				}
			} else if (action.payload.activeKey) {
				if (state.itemKeysLeft.includes(action.payload.activeKey)) {
					state.activeKeyLeft = action.payload.activeKey;
				} else if (state.itemKeysRight.includes(action.payload.activeKey)) {
					state.activeKeyRight = action.payload.activeKey;
				}
			}
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setSortable,
	setItemKeys,
	moveItemKey,
	toggleItemKeySide,
	setActiveKey,
} = drawersSlice.actions;

// Export the slice reducer for use in the store configuration
export default drawersSlice.reducer;
