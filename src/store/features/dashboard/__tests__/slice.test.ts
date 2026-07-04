/**
 * Tests for dashboard slice reducers and selectors.
 */

import dashboardReducer, {
	setInitialized,
	setElementsSettings,
	setIsEditingDashboard,
	setDashboardStyle,
	setItems,
	addItem,
	removeItemKey,
	setEditItemAccordingToPosition,
	setEditItemKeyAction,
	initialSettings,
} from '../slice';

/**
 * Internal dependencies
 */
import type { DashboardState } from '../slice';
import type { DashboardItem } from '../types';
import type { RootState } from '../../../store';
import {
	selectInitialized,
	selectElementsSettings,
	selectIsEditingDashboard,
	selectDashboardStyle,
	selectItemsCount,
	selectEditItemKey,
	selectItemByKey,
	getItemByKeyResultFn,
} from '../selectors';

const buildRoot = (overrides: Partial<DashboardState> = {}) =>
	({
		dashboard: {
			initialized: false,
			isEditingDashboard: false,
			elementsSettings: {},
			...initialSettings,
			...overrides,
		},
	}) as RootState;

const makeItem = (overrides: Partial<DashboardItem> = {}): DashboardItem => ({
	key: 'item-1',
	elementType: 'zoomLevel',
	...overrides,
});

// ===========================================================================
// Reducers
// ===========================================================================

describe('dashboard slice reducers', () => {
	it('setInitialized', () => {
		const state = dashboardReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setElementsSettings replaces settings', () => {
		const settings = { zoomLevel: { key: 'zoomLevel', label: 'Zoom' } as any };
		const state = dashboardReducer(undefined, setElementsSettings(settings));
		expect(state.elementsSettings).toEqual(settings);
	});

	it('setIsEditingDashboard toggles editing', () => {
		const state = dashboardReducer(undefined, setIsEditingDashboard(true));
		expect(state.isEditingDashboard).toBe(true);

		const state2 = dashboardReducer(state, setIsEditingDashboard(false));
		expect(state2.isEditingDashboard).toBe(false);
	});

	describe('setDashboardStyle', () => {
		it('sets top style', () => {
			const style = { align: 'center', fontSize: 24, showLabel: true, showIcon: true };
			const state = dashboardReducer(
				undefined,
				setDashboardStyle({ position: 'top', style })
			);
			expect(state.dashboardStyleTop).toEqual(style);
		});

		it('sets bottom style', () => {
			const style = { align: 'start', fontSize: 16, showLabel: false, showIcon: false };
			const state = dashboardReducer(
				undefined,
				setDashboardStyle({ position: 'bottom', style })
			);
			expect(state.dashboardStyleBottom).toEqual(style);
		});
	});

	describe('setItems', () => {
		it('sets top items', () => {
			const items = [makeItem({ key: 'a' })];
			const state = dashboardReducer(undefined, setItems({ position: 'top', items }));
			expect(state.itemsTop).toEqual(items);
		});

		it('sets bottom items', () => {
			const items = [makeItem({ key: 'b' })];
			const state = dashboardReducer(undefined, setItems({ position: 'bottom', items }));
			expect(state.itemsBottom).toEqual(items);
		});
	});

	describe('addItem', () => {
		it('adds item to top', () => {
			const item = makeItem({ key: 'new' });
			const state = dashboardReducer(undefined, addItem({ position: 'top', item }));
			// Default itemsTop is empty, adding one makes length 1
			expect(state.itemsTop).toHaveLength(1);
			expect(state.itemsTop[0].key).toBe('new');
		});
	});

	describe('removeItemKey', () => {
		it('removes item from top', () => {
			const prev: DashboardState = {
				initialized: false,
				isEditingDashboard: false,
				elementsSettings: {},
				itemsTop: [makeItem({ key: 'a' }), makeItem({ key: 'b' })],
				itemsBottom: [],
				dashboardStyleTop: initialSettings.dashboardStyleTop,
				dashboardStyleBottom: initialSettings.dashboardStyleBottom,
			};
			const state = dashboardReducer(prev, removeItemKey({ position: 'top', itemKey: 'a' }));
			expect(state.itemsTop).toHaveLength(1);
			expect(state.itemsTop[0].key).toBe('b');
		});
	});

	describe('setEditItemAccordingToPosition', () => {
		it('sets editItemKey to first item of top', () => {
			const prev: DashboardState = {
				initialized: false,
				isEditingDashboard: false,
				elementsSettings: {},
				itemsTop: [makeItem({ key: 'first' })],
				itemsBottom: [],
				dashboardStyleTop: initialSettings.dashboardStyleTop,
				dashboardStyleBottom: initialSettings.dashboardStyleBottom,
			};
			const state = dashboardReducer(prev, setEditItemAccordingToPosition('top'));
			expect(state.editItemKey).toBe('first');
		});

		it('sets editItemKey to undefined when top is empty', () => {
			const state = dashboardReducer(undefined, setEditItemAccordingToPosition('top'));
			expect(state.editItemKey).toBeUndefined();
		});

		it('sets editItemKey to first item of bottom', () => {
			const prev: DashboardState = {
				initialized: false,
				isEditingDashboard: false,
				elementsSettings: {},
				itemsTop: [],
				itemsBottom: [makeItem({ key: 'bottom-first' })],
				dashboardStyleTop: initialSettings.dashboardStyleTop,
				dashboardStyleBottom: initialSettings.dashboardStyleBottom,
			};
			const state = dashboardReducer(prev, setEditItemAccordingToPosition('bottom'));
			expect(state.editItemKey).toBe('bottom-first');
		});
	});

	it('setEditItemKeyAction sets editItemKey directly', () => {
		const state = dashboardReducer(undefined, setEditItemKeyAction('direct-key'));
		expect(state.editItemKey).toBe('direct-key');
	});
});

// ===========================================================================
// Selectors
// ===========================================================================

describe('dashboard selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectElementsSettings', () => {
		const settings = { test: {} as any };
		expect(selectElementsSettings(buildRoot({ elementsSettings: settings }))).toEqual(settings);
	});

	it('selectIsEditingDashboard', () => {
		expect(selectIsEditingDashboard(buildRoot({ isEditingDashboard: true }))).toBe(true);
	});

	it('selectDashboardStyle returns top style', () => {
		const style = selectDashboardStyle(
			buildRoot({
				dashboardStyleTop: {
					align: 'start',
					fontSize: 30,
					showLabel: true,
					showIcon: true,
				},
			}),
			'top'
		);
		expect(style).toEqual({ align: 'start', fontSize: 30, showLabel: true, showIcon: true });
	});

	it('selectDashboardStyle returns bottom style for non-top position', () => {
		const style = selectDashboardStyle(
			buildRoot({
				dashboardStyleBottom: {
					align: 'end',
					fontSize: 12,
					showLabel: false,
					showIcon: false,
				},
			}),
			'bottom'
		);
		expect(style).toEqual({ align: 'end', fontSize: 12, showLabel: false, showIcon: false });
	});

	it('selectItemsCount returns top count', () => {
		const state = buildRoot({
			itemsTop: [makeItem(), makeItem()],
			itemsBottom: [makeItem()],
		});
		expect(selectItemsCount(state, 'top')).toBe(2);
	});

	it('selectItemsCount returns total when no position', () => {
		const state = buildRoot({
			itemsTop: [makeItem(), makeItem()],
			itemsBottom: [makeItem()],
		});
		expect(selectItemsCount(state)).toBe(3);
	});

	it('selectEditItemKey', () => {
		expect(selectEditItemKey(buildRoot({ editItemKey: 'k' }))).toBe('k');
	});

	describe('getItemByKeyResultFn', () => {
		it('finds item in top', () => {
			const itemsTop = [makeItem({ key: 'a' }), makeItem({ key: 'b' })];
			const result = getItemByKeyResultFn(itemsTop, [], 'a');
			expect(result.position).toBe('top');
			expect(result.idx).toBe(0);
			expect(result.item?.key).toBe('a');
		});

		it('finds item in bottom', () => {
			const itemsBottom = [makeItem({ key: 'x' })];
			const result = getItemByKeyResultFn([], itemsBottom, 'x');
			expect(result.position).toBe('bottom');
			expect(result.idx).toBe(0);
		});

		it('returns idx=-1 for missing key', () => {
			const result = getItemByKeyResultFn([], [], 'missing');
			expect(result.idx).toBe(-1);
			expect(result.item).toBeUndefined();
		});

		it('returns idx=-1 and undefined item when key not provided', () => {
			const result = getItemByKeyResultFn([makeItem()], [], undefined);
			expect(result.idx).toBe(-1);
			expect(result.item).toBeUndefined();
		});
	});

	describe('selectItemByKey', () => {
		it('finds item by key', () => {
			const state = buildRoot({
				itemsTop: [makeItem({ key: 'findme', elementType: 'spacer' })],
			});
			const result = selectItemByKey(state, 'findme');
			expect(result.item?.key).toBe('findme');
			expect(result.position).toBe('top');
		});
	});
});
