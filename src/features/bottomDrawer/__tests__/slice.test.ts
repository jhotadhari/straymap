/**
 * Tests for bottomDrawer slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import bottomDrawerReducer, {
	setInitialized,
	setItemKeys,
	addItemKey,
	removeItemKey,
	setActiveKey,
	initialSettings,
} from '../slice';
import type { BottomDrawersState } from '../slice';
import type { RootState } from '../../../store/store';
import { selectActiveKey, selectItemKeys } from '../selectors';

const buildRoot = (overrides: Partial<BottomDrawersState> = {}) =>
	({
		bottomDrawer: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

describe('bottomDrawer slice reducers', () => {
	it('setInitialized', () => {
		const state = bottomDrawerReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setItemKeys', () => {
		const state = bottomDrawerReducer(undefined, setItemKeys(['a', 'b']));
		expect(state.itemKeys).toEqual(['a', 'b']);
	});

	describe('addItemKey', () => {
		it('appends a key', () => {
			const prev: BottomDrawersState = {
				initialized: false,
				itemKeys: ['a'],
			};
			const state = bottomDrawerReducer(prev, addItemKey('b'));
			expect(state.itemKeys).toEqual(['a', 'b']);
		});
	});

	describe('removeItemKey', () => {
		it('removes a key and clears activeKey if active', () => {
			const prev: BottomDrawersState = {
				initialized: false,
				itemKeys: ['a', 'b'],
				activeKey: 'a',
			};
			const state = bottomDrawerReducer(prev, removeItemKey('a'));
			expect(state.itemKeys).toEqual(['b']);
			expect(state.activeKey).toBeUndefined();
		});

		it('keeps activeKey if a different key is removed', () => {
			const prev: BottomDrawersState = {
				initialized: false,
				itemKeys: ['a', 'b'],
				activeKey: 'a',
			};
			const state = bottomDrawerReducer(prev, removeItemKey('b'));
			expect(state.itemKeys).toEqual(['a']);
			expect(state.activeKey).toBe('a');
		});
	});

	describe('setActiveKey', () => {
		it('sets activeKey for a key in itemKeys', () => {
			const state = bottomDrawerReducer(undefined, setActiveKey('example'));
			expect(state.activeKey).toBe('example');
		});

		it('clears activeKey when payload is undefined', () => {
			const prev: BottomDrawersState = {
				initialized: false,
				itemKeys: ['example'],
				activeKey: 'example',
			};
			const state = bottomDrawerReducer(prev, setActiveKey(undefined));
			expect(state.activeKey).toBeUndefined();
		});

		it('does not set activeKey for a key not in itemKeys', () => {
			const state = bottomDrawerReducer(undefined, setActiveKey('nonexistent'));
			expect(state.activeKey).toBeUndefined();
		});
	});

	it('initial state has expected defaults', () => {
		const state = bottomDrawerReducer(undefined, { type: '@@INIT' });
		expect(state.itemKeys).toEqual(['example']);
	});
});

describe('bottomDrawer selectors', () => {
	it('selectActiveKey', () => {
		expect(selectActiveKey(buildRoot({ activeKey: 'example' }))).toBe('example');
	});

	it('selectItemKeys filters out keys with no registered item', () => {
		const state = buildRoot({ itemKeys: ['example', 'missing'] });
		const keys = selectItemKeys(state);
		expect(keys).toContain('example');
		expect(keys).not.toContain('missing');
	});
});
