/**
 * Tests for lang slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import langReducer, { setInitialized, setLang, initialSettings } from '../slice';
import type { LangState } from '../slice';
import { selectInitialized, selectLang } from '../selectors';
import type { RootState } from '../../../store/store';

const buildState = (overrides: Partial<LangState> = {}) =>
	({
		lang: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

describe('lang slice reducers', () => {
	it('setInitialized', () => {
		const state = langReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setLang updates language', () => {
		const state = langReducer(undefined, setLang('de'));
		expect(state.lang).toBe('de');
	});

	it('default lang is system', () => {
		const state = langReducer(undefined, { type: '@@INIT' });
		expect(state.lang).toBe('system');
	});
});

describe('lang selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildState({ initialized: true }))).toBe(true);
	});

	it('selectLang', () => {
		expect(selectLang(buildState({ lang: 'en' }))).toBe('en');
	});
});
