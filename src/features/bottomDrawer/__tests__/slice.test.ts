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
import { setBottomDrawerItemResolver } from '../dynamicItems';
import { BottomDrawerItem } from '../types';

const buildRoot = (overrides: Partial<BottomDrawersState> = {}) =>
	({
		bottomDrawer: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
		routing: {
			isRouting: false,
		},
		lines: {
			profileLines: [],
		},
	}) as unknown as RootState;

const routingProfileItem: BottomDrawerItem = {
	key: 'altitudeProfile:routing',
	DisplayComponent: () => null,
};

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
		it('sets activeKey', () => {
			const state = bottomDrawerReducer(undefined, setActiveKey('altitudeProfile:routing'));
			expect(state.activeKey).toBe('altitudeProfile:routing');
		});

		it('sets activeKey for a key not in itemKeys (derived keys)', () => {
			const state = bottomDrawerReducer(undefined, setActiveKey('someDerivedKey'));
			expect(state.activeKey).toBe('someDerivedKey');
		});

		it('clears activeKey when payload is undefined', () => {
			const prev: BottomDrawersState = {
				initialized: false,
				itemKeys: ['a'],
				activeKey: 'a',
			};
			const state = bottomDrawerReducer(prev, setActiveKey(undefined));
			expect(state.activeKey).toBeUndefined();
		});
	});

	it('initial state has empty itemKeys', () => {
		const state = bottomDrawerReducer(undefined, { type: '@@INIT' });
		expect(state.itemKeys).toEqual([]);
	});
});

describe('bottomDrawer selectors', () => {
	it('selectActiveKey', () => {
		expect(selectActiveKey(buildRoot({ activeKey: 'a' }))).toBe('a');
	});

	it('selectItemKeys filters out keys with no registered item', () => {
		const state = buildRoot({ itemKeys: ['missing'] });
		const keys = selectItemKeys(state);
		expect(keys).toEqual([]);
	});

	it('selectItemKeys appends the routing profile key while routing is active', () => {
		setBottomDrawerItemResolver((key) =>
			key === 'altitudeProfile:routing' ? routingProfileItem : undefined
		);
		const state = {
			...buildRoot(),
			routing: { isRouting: 42 },
		} as unknown as RootState;
		const keys = selectItemKeys(state);
		expect(keys).toContain('altitudeProfile:routing');
		setBottomDrawerItemResolver(undefined);
	});
});
