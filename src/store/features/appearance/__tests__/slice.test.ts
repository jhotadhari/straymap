/**
 * Tests for appearance slice reducers and selectors.
 */

import appearanceReducer, {
	setInitialized,
	setTheme,
	setCursorAction,
	initialSettings,
} from '../slice';
import type { AppearanceState } from '../slice';
import { selectInitialized, selectTheme, selectCursor } from '../selectors';
import type { RootState } from "../../../store";

const buildState = (overrides: Partial<AppearanceState> = {}) =>
	({
		appearance: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

describe('appearance slice reducers', () => {
	it('setInitialized updates initialized flag', () => {
		const state = appearanceReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setTheme updates theme', () => {
		const state = appearanceReducer(undefined, setTheme('dark'));
		expect(state.theme).toBe('dark');
	});

	it('setCursorAction replaces cursor config', () => {
		const newCursor = { iconSource: 'crosshair', size: 30, color: '#00ff00' };
		const state = appearanceReducer(undefined, setCursorAction(newCursor));
		expect(state.cursor).toEqual(newCursor);
	});

	it('default theme is system', () => {
		const state = appearanceReducer(undefined, { type: '@@INIT' });
		expect(state.theme).toBe('system');
	});

	it('default cursor has expected shape', () => {
		const state = appearanceReducer(undefined, { type: '@@INIT' });
		expect(state.cursor).toEqual({
			iconSource: 'target',
			size: 25,
			color: '#ed1c23',
		});
	});
});

describe('appearance selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildState({ initialized: true }))).toBe(true);
	});

	it('selectTheme', () => {
		expect(selectTheme(buildState({ theme: 'light' }))).toBe('light');
	});

	it('selectCursor', () => {
		const cursor = { iconSource: 'dot', size: 10, color: '#fff' };
		expect(selectCursor(buildState({ cursor }))).toEqual(cursor);
	});
});
