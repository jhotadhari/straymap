/**
 * Tests for ui slice reducers, thunks, and selectors.
 */

import uiReducer, {
	setInitialized,
	setExpandedElements,
	setElementExpanded,
	setUiItemKeys,
	setBusyKeys,
	addBusyKey,
	removeBusyKey,
	addUiItemKey,
	initialSettings,
} from '../slice';
import type { UiState } from '../slice';
import {
	selectInitialized,
	selectExpandedElements,
	selectElementExpanded,
	selectIsBusy,
	selectUiItemKeys,
} from '../selectors';

const buildRoot = (overrides: Partial<UiState> = {}): { ui: UiState } => ({
	ui: {
		initialized: false,
		busyKeys: [],
		uiItemKeys: [],
		...initialSettings,
		...overrides,
	},
});

// ===========================================================================
// Reducers
// ===========================================================================

describe('ui slice reducers', () => {
	it('setInitialized', () => {
		const state = uiReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setExpandedElements replaces expanded elements', () => {
		const state = uiReducer(undefined, setExpandedElements(['a', 'b']));
		expect(state.expandedElements).toEqual(['a', 'b']);
	});

	describe('setElementExpanded', () => {
		it('adds key when expanded=true', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: [],
				uiItemKeys: [],
				expandedElements: [],
			};
			const state = uiReducer(prev, setElementExpanded({ key: 'panel1', expanded: true }));
			expect(state.expandedElements).toEqual(['panel1']);
		});

		it('removes key when expanded=false', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: [],
				uiItemKeys: [],
				expandedElements: ['panel1', 'panel2'],
			};
			const state = uiReducer(prev, setElementExpanded({ key: 'panel1', expanded: false }));
			expect(state.expandedElements).toEqual(['panel2']);
		});

		it('deduplicates on add', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: [],
				uiItemKeys: [],
				expandedElements: ['panel1'],
			};
			const state = uiReducer(prev, setElementExpanded({ key: 'panel1', expanded: true }));
			expect(state.expandedElements).toEqual(['panel1']);
		});
	});

	it('setUiItemKeys replaces ui item keys', () => {
		const state = uiReducer(
			undefined,
			setUiItemKeys([
				'a',
				'b',
				'c',
			])
		);
		expect(state.uiItemKeys).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	describe('busyKeys', () => {
		it('addBusyKey adds key if not present', () => {
			const state = uiReducer(undefined, addBusyKey('loading'));
			expect(state.busyKeys).toEqual(['loading']);
		});

		it('addBusyKey does not add duplicate', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: ['loading'],
				uiItemKeys: [],
				expandedElements: [],
			};
			const state = uiReducer(prev, addBusyKey('loading'));
			expect(state.busyKeys).toEqual(['loading']);
		});

		it('removeBusyKey removes key if present', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: ['loading', 'saving'],
				uiItemKeys: [],
				expandedElements: [],
			};
			const state = uiReducer(prev, removeBusyKey('loading'));
			expect(state.busyKeys).toEqual(['saving']);
		});

		it('removeBusyKey no-op for missing key', () => {
			const prev: UiState = {
				initialized: false,
				busyKeys: ['loading'],
				uiItemKeys: [],
				expandedElements: [],
			};
			const state = uiReducer(prev, removeBusyKey('nonexistent'));
			expect(state.busyKeys).toEqual(['loading']);
		});

		it('setBusyKeys replaces busy keys', () => {
			const state = uiReducer(undefined, setBusyKeys(['a', 'b']));
			expect(state.busyKeys).toEqual(['a', 'b']);
		});
	});
});

// ===========================================================================
// Thunks
// ===========================================================================

describe('ui thunks', () => {
	describe('addUiItemKey', () => {
		it('adds key if not already present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ uiItemKeys: ['existing'] }));

			addUiItemKey('new-key')(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'ui/setUiItemKeys',
					payload: ['existing', 'new-key'],
				})
			);
		});

		it('no-op when key already present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ uiItemKeys: ['existing'] }));

			addUiItemKey('existing')(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});
});

// ===========================================================================
// Selectors
// ===========================================================================

describe('ui selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectExpandedElements', () => {
		expect(selectExpandedElements(buildRoot({ expandedElements: ['a'] }))).toEqual(['a']);
	});

	it('selectElementExpanded returns true when key in array', () => {
		expect(selectElementExpanded(buildRoot({ expandedElements: ['panel'] }), 'panel')).toBe(
			true
		);
	});

	it('selectElementExpanded returns false when key not in array', () => {
		expect(selectElementExpanded(buildRoot({ expandedElements: [] }), 'panel')).toBe(false);
	});

	it('selectIsBusy returns true when busyKeys non-empty', () => {
		expect(selectIsBusy(buildRoot({ busyKeys: ['work'] }))).toBe(true);
	});

	it('selectIsBusy returns false when busyKeys empty', () => {
		expect(selectIsBusy(buildRoot({ busyKeys: [] }))).toBe(false);
	});

	it('selectUiItemKeys', () => {
		expect(selectUiItemKeys(buildRoot({ uiItemKeys: ['a', 'b'] }))).toEqual(['a', 'b']);
	});
});
