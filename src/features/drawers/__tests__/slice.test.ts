/**
 * Tests for drawers slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import drawersReducer, {
	setInitialized,
	setItemKeys,
	moveItemKey,
	toggleItemKeySide,
	setActiveKey,
	setSortable,
	initialSettings,
} from '../slice';
import type { DrawersState } from '../slice';
import type { RootState } from '../../../store/store';
import { selectSortable, selectActiveKey, selectItemKeys, selectSideForKey } from '../selectors';
import { SETTINGS_HANDLE_KEY } from '../constants';

const buildRoot = (overrides: Partial<DrawersState> = {}) =>
	({
		drawers: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

const buildState = (overrides: Partial<DrawersState> = {}): DrawersState => ({
	initialized: false,
	...initialSettings,
	...overrides,
});

describe('drawers slice reducers', () => {
	it('setInitialized', () => {
		const state = drawersReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setSortable', () => {
		const state = drawersReducer(undefined, setSortable(true));
		expect(state.sortable).toBe(true);
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

		it('sets available item keys', () => {
			const state = drawersReducer(
				undefined,
				setItemKeys({ side: 'available', itemKeys: ['a', 'b'] })
			);
			expect(state.itemKeysAvailable).toEqual(['a', 'b']);
		});
	});

	describe('moveItemKey', () => {
		it('moves an item from right to left at the given index', () => {
			const prev = buildState({
				itemKeysLeft: ['lines'],
				itemKeysRight: [
					'maps',
					'routing',
					'tracking',
				],
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'routing', side: 'left', index: 1 })
			);
			expect(state.itemKeysLeft).toEqual(['lines', 'routing']);
			expect(state.itemKeysRight).toEqual(['maps', 'tracking']);
		});

		it('moves an item from left to available as first item', () => {
			const prev = buildState({
				itemKeysLeft: ['lines', 'routing'],
				itemKeysAvailable: [SETTINGS_HANDLE_KEY],
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'lines', side: 'available', index: 0 })
			);
			expect(state.itemKeysLeft).toEqual(['routing']);
			expect(state.itemKeysAvailable).toEqual(['lines', SETTINGS_HANDLE_KEY]);
		});

		it('clears activeKeyLeft when the active item is moved away', () => {
			const prev = buildState({
				itemKeysLeft: ['lines', 'routing'],
				activeKeyLeft: 'lines',
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'lines', side: 'available', index: 0 })
			);
			expect(state.activeKeyLeft).toBeUndefined();
		});

		it('clears activeKeyRight when the active item is moved away', () => {
			const prev = buildState({
				itemKeysRight: ['maps', 'routing'],
				activeKeyRight: 'maps',
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'maps', side: 'left', index: 0 })
			);
			expect(state.activeKeyRight).toBeUndefined();
		});

		it('reorders within the same side', () => {
			const prev = buildState({
				itemKeysRight: [
					'maps',
					'routing',
					'tracking',
				],
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'tracking', side: 'right', index: 0 })
			);
			expect(state.itemKeysRight).toEqual([
				'tracking',
				'maps',
				'routing',
			]);
		});

		it('appends when index is larger than the list length', () => {
			const prev = buildState({
				itemKeysLeft: ['lines'],
				itemKeysRight: ['maps', 'routing'],
			});
			const state = drawersReducer(
				prev,
				moveItemKey({ itemKey: 'routing', side: 'left', index: 99 })
			);
			expect(state.itemKeysLeft).toEqual(['lines', 'routing']);
			expect(state.itemKeysRight).toEqual(['maps']);
		});
	});

	describe('toggleItemKeySide', () => {
		it('adds an item not on the side to the end of that side', () => {
			const prev = buildState({
				itemKeysLeft: ['lines'],
				itemKeysRight: ['maps'],
				itemKeysAvailable: [SETTINGS_HANDLE_KEY, 'routing'],
			});
			const state = drawersReducer(
				prev,
				toggleItemKeySide({ itemKey: 'routing', side: 'left' })
			);
			expect(state.itemKeysLeft).toEqual(['lines', 'routing']);
			expect(state.itemKeysAvailable).toEqual([SETTINGS_HANDLE_KEY]);
		});

		it('removes an item on the side to available as first item', () => {
			const prev = buildState({
				itemKeysLeft: ['lines', 'routing'],
			});
			const state = drawersReducer(
				prev,
				toggleItemKeySide({ itemKey: 'lines', side: 'left' })
			);
			expect(state.itemKeysLeft).toEqual(['routing']);
			expect(state.itemKeysAvailable[0]).toBe('lines');
		});

		it('moves an item from the other side when toggled', () => {
			const prev = buildState({
				itemKeysLeft: ['lines'],
				itemKeysRight: ['maps', 'routing'],
			});
			const state = drawersReducer(
				prev,
				toggleItemKeySide({ itemKey: 'maps', side: 'left' })
			);
			expect(state.itemKeysLeft).toEqual(['lines', 'maps']);
			expect(state.itemKeysRight).toEqual(['routing']);
		});
	});

	describe('setActiveKey', () => {
		it('sets activeKeyLeft with explicit side', () => {
			const state = drawersReducer(
				undefined,
				setActiveKey({ side: 'left', activeKey: 'lines' })
			);
			expect(state.activeKeyLeft).toBe('lines');
		});

		it('sets activeKeyRight with explicit side', () => {
			const state = drawersReducer(
				undefined,
				setActiveKey({ side: 'right', activeKey: 'maps' })
			);
			expect(state.activeKeyRight).toBe('maps');
		});

		it('clears activeKeyLeft when activeKey is falsy', () => {
			const prev = buildState({
				itemKeysLeft: ['a'],
				itemKeysRight: [],
				activeKeyLeft: 'a',
			});
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
			// Default left keys: ['lines']
			expect(state.activeKeyLeft).toBe('lines');
		});

		it('auto-detects side when side not provided', () => {
			const state = drawersReducer(undefined, setActiveKey({ activeKey: 'lines' }));
			expect(state.activeKeyLeft).toBe('lines');
		});
	});

	it('initial state has expected defaults', () => {
		const state = drawersReducer(undefined, { type: '@@INIT' });
		expect(state.itemKeysLeft).toEqual([
			'lines',
		]);
		expect(state.itemKeysRight).toEqual([
			'maps',
			'routing',
			'tracking',
		]);
		expect(state.itemKeysAvailable).toEqual([SETTINGS_HANDLE_KEY]);
	});
});

describe('drawers selectors', () => {
	it('selectSortable', () => {
		expect(selectSortable(buildRoot({ sortable: true }))).toBe(true);
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
		expect(keys).toContain('lines');
	});

	it('selectItemKeys for available returns settings handle by default', () => {
		const state = buildRoot();
		const keys = selectItemKeys(state, { side: 'available' });
		expect(keys).toContain(SETTINGS_HANDLE_KEY);
	});

	it('selectItemKeys for available filters obsolete persisted keys', () => {
		const state = buildRoot({
			itemKeysAvailable: ['searchPlace', SETTINGS_HANDLE_KEY],
		});
		const keys = selectItemKeys(state, { side: 'available' });
		expect(keys).toEqual([SETTINGS_HANDLE_KEY]);
	});

	it('selectSideForKey returns side for a key', () => {
		const state = buildRoot();
		expect(selectSideForKey(state, 'lines')).toBe('left');
		expect(selectSideForKey(state, 'maps')).toBe('right');
		expect(selectSideForKey(state, SETTINGS_HANDLE_KEY)).toBeUndefined();
	});
});
