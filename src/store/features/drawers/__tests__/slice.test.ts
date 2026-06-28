/**
 * Tests for drawers slice reducers and selectors.
 */

import drawersReducer, {
	setInitialized,
	setControlHandleSide,
	setItemKeys,
	addItemKey,
	removeItemKey,
	setActiveKey,
	initialSettings,
} from '../slice';
import type { DrawersState } from '../slice';
import {
	selectInitialized,
	selectControlHandleSide,
	selectActiveKey,
	selectItemKeys,
	selectSideForKey,
} from '../selectors';

const buildRoot = (overrides: Partial<DrawersState> = {}): { drawers: DrawersState } => ({
	drawers: {
		initialized: false,
		...initialSettings,
		...overrides,
	},
});

describe('drawers slice reducers', () => {
	it('setInitialized', () => {
		const state = drawersReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setControlHandleSide', () => {
		const state = drawersReducer(undefined, setControlHandleSide('left'));
		expect(state.controlHandleSide).toBe('left');
	});

	describe('setItemKeys', () => {
		it('sets left item keys', () => {
			const state = drawersReducer(
				undefined,
				setItemKeys({ side: 'left', itemKeys: ['a', 'b'] })
			);
			expect(state.itemKeysLeft).toEqual(['a', 'b']);
		});

		it('sets right item keys', () => {
			const state = drawersReducer(
				undefined,
				setItemKeys({ side: 'right', itemKeys: ['x', 'y'] })
			);
			expect(state.itemKeysRight).toEqual(['x', 'y']);
		});
	});

	describe('addItemKey', () => {
		it('adds to left side', () => {
			const prev: DrawersState = {
				initialized: false,
				itemKeysLeft: ['a'],
				itemKeysRight: ['x'],
				controlHandleSide: 'right',
			};
			const state = drawersReducer(prev, addItemKey({ side: 'left', itemKey: 'b' }));
			expect(state.itemKeysLeft).toEqual(['a', 'b']);
			expect(state.itemKeysRight).toEqual(['x']); // unchanged
		});
	});

	describe('removeItemKey', () => {
		it('removes from left and clears activeKeyLeft if active', () => {
			const prev: DrawersState = {
				initialized: false,
				itemKeysLeft: ['a', 'b'],
				itemKeysRight: ['x'],
				activeKeyLeft: 'a',
				controlHandleSide: 'right',
			};
			const state = drawersReducer(prev, removeItemKey({ side: 'left', itemKey: 'a' }));
			expect(state.itemKeysLeft).toEqual(['b']);
			expect(state.activeKeyLeft).toBeUndefined();
		});

		it('does not clear activeKeyLeft if different item removed', () => {
			const prev: DrawersState = {
				initialized: false,
				itemKeysLeft: ['a', 'b'],
				itemKeysRight: ['x'],
				activeKeyLeft: 'a',
				controlHandleSide: 'right',
			};
			const state = drawersReducer(prev, removeItemKey({ side: 'left', itemKey: 'b' }));
			expect(state.itemKeysLeft).toEqual(['a']);
			expect(state.activeKeyLeft).toBe('a'); // still active
		});
	});

	describe('setActiveKey', () => {
		it('sets activeKeyLeft with explicit side', () => {
			const state = drawersReducer(
				undefined,
				setActiveKey({ side: 'left', activeKey: 'position' })
			);
			expect(state.activeKeyLeft).toBe('position');
		});

		it('sets activeKeyRight with explicit side', () => {
			const state = drawersReducer(
				undefined,
				setActiveKey({ side: 'right', activeKey: 'maps' })
			);
			expect(state.activeKeyRight).toBe('maps');
		});

		it('clears activeKeyLeft when activeKey is falsy', () => {
			const prev: DrawersState = {
				initialized: false,
				itemKeysLeft: ['a'],
				itemKeysRight: [],
				activeKeyLeft: 'a',
				controlHandleSide: 'right',
			};
			const state = drawersReducer(
				prev,
				setActiveKey({ side: 'left', activeKey: undefined })
			);
			expect(state.activeKeyLeft).toBeUndefined();
		});

		it('does not set activeKey for key not in itemKeys', () => {
			const state = drawersReducer(
				undefined,
				setActiveKey({ side: 'left', activeKey: 'nonexistent' })
			);
			// Default left keys: ['position', 'lines', 'waypoints']
			expect(state.activeKeyLeft).toBeUndefined();
		});

		it('auto-detects side when side not provided', () => {
			const state = drawersReducer(undefined, setActiveKey({ activeKey: 'position' }));
			expect(state.activeKeyLeft).toBe('position');
		});
	});

	it('initial state has expected defaults', () => {
		const state = drawersReducer(undefined, { type: '@@INIT' });
		expect(state.itemKeysLeft).toEqual([
			'position',
			'lines',
			'waypoints',
		]);
		expect(state.itemKeysRight).toEqual([
			'maps',
			'searchPlace',
			'brouter',
		]);
		expect(state.controlHandleSide).toBe('right');
	});
});

describe('drawers selectors', () => {
	it('selectControlHandleSide', () => {
		expect(selectControlHandleSide(buildRoot({ controlHandleSide: 'left' }))).toBe('left');
	});

	it('selectActiveKey returns left activeKey', () => {
		const state = buildRoot({ activeKeyLeft: 'lines' });
		expect(selectActiveKey(state, { side: 'left' })).toBe('lines');
	});

	it('selectActiveKey returns right activeKey', () => {
		const state = buildRoot({ activeKeyRight: 'maps' });
		expect(selectActiveKey(state, { side: 'right' })).toBe('maps');
	});

	it('selectActiveKey returns undefined for unknown side', () => {
		expect(selectActiveKey(buildRoot({}), { side: 'unknown' } as any)).toBeUndefined();
	});

	it('selectItemKeys returns filtered keys for valid items', () => {
		const state = buildRoot();
		const keys = selectItemKeys(state, { side: 'left' });
		// All default left keys should be valid drawer items
		expect(keys).toContain('position');
		expect(keys).toContain('lines');
		expect(keys).toContain('waypoints');
	});

	it('selectSideForKey returns side for a key', () => {
		const state = buildRoot();
		expect(selectSideForKey(state, 'position')).toBe('left');
		expect(selectSideForKey(state, 'maps')).toBe('right');
		expect(selectSideForKey(state, 'nonexistent')).toBeUndefined();
	});
});
