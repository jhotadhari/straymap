/**
 * Tests for src/store/utils.ts
 *
 * Pure utility functions.  Mocked: none currently needed.
 */

import { getSetterThunkWithGetter } from '../utils';

// ===========================================================================
// getSetterThunkWithGetter
// ===========================================================================

describe('getSetterThunkWithGetter', () => {
	it('creates a thunk that dispatches with a direct value', () => {
		const selector = jest.fn((state: any) => state.value);
		const setter = jest.fn(
			(val: number) => ({ type: 'SET', payload: val }) as any,
		);

		const thunk = getSetterThunkWithGetter(selector, setter)(42);

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ value: 10 })) as any;

		thunk(dispatch, getState, undefined as any);

		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('creates a thunk that calls a getter function with current value', () => {
		const selector = jest.fn((state: any) => state.value);
		const setter = jest.fn(
			(val: number) => ({ type: 'SET', payload: val }) as any,
		);

		// Use a plain function — the instanceof Function check inside
		// getSetterThunkWithGetter needs a real function, and jest.fn()
		// instances may not pass instanceof in all transform contexts.
		const getter = (current: number) => current * 2;
		const thunk = getSetterThunkWithGetter(selector, setter)(getter);

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ value: 21 })) as any;

		thunk(dispatch, getState, undefined as any);

		// Verify via dispatch payload: 21 * 2 = 42
		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('respects selector extracting the right slice', () => {
		const selector = jest.fn((state: any) => state.nested.deep.value);
		const setter = jest.fn(
			(val: string) => ({ type: 'SET', payload: val }) as any,
		);

		const thunk = getSetterThunkWithGetter(selector, setter)('new-val');

		const dispatch = jest.fn();
		const getState = jest.fn(() => ({
			nested: { deep: { value: 'old-val' } },
		})) as any;

		thunk(dispatch, getState, undefined as any);

		expect(dispatch).toHaveBeenCalledWith({
			type: 'SET',
			payload: 'new-val',
		});
	});
});
