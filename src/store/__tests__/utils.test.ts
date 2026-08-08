/**
 * Internal dependencies
 */
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { getSetterThunkWithGetter } from '../utils';
import type { RootState } from '../store';

// ===========================================================================
// getSetterThunkWithGetter
// ===========================================================================

describe('getSetterThunkWithGetter', () => {
	const mkSetter = <T>() =>
		jest.fn<ReturnType<ActionCreatorWithPayload<T, string>>, [T]>((val) => ({
			type: 'SET',
			payload: val,
		}));
	const mkDispatch = () => jest.fn();
	const mkGetState = (value: any) => jest.fn<RootState, []>(() => value as RootState);

	it('creates a thunk that dispatches with a direct value', () => {
		const selector = jest.fn((state: RootState) => (state as any).value as number);
		const setter = mkSetter<number>();

		const thunk = getSetterThunkWithGetter(
			selector,
			setter as unknown as ActionCreatorWithPayload<number, string>
		)(42);

		const dispatch = mkDispatch();
		const getState = mkGetState({ value: 10 });

		thunk(dispatch, getState, undefined as unknown);

		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('creates a thunk that calls a getter function with current value', () => {
		const selector = jest.fn((state: RootState) => (state as any).value as number);
		const setter = mkSetter<number>();

		const getter = (current: number) => current * 2;
		const thunk = getSetterThunkWithGetter(
			selector,
			setter as unknown as ActionCreatorWithPayload<number, string>
		)(getter);

		const dispatch = mkDispatch();
		const getState = mkGetState({ value: 21 });

		thunk(dispatch, getState, undefined as unknown);

		expect(dispatch).toHaveBeenCalledWith({ type: 'SET', payload: 42 });
	});

	it('respects selector extracting the right slice', () => {
		const selector = jest.fn(
			(state: RootState) => (state as any).nested?.deep?.value as string
		);
		const setter = mkSetter<string>();

		const thunk = getSetterThunkWithGetter(
			selector,
			setter as unknown as ActionCreatorWithPayload<string, string>
		)('new-val');

		const dispatch = mkDispatch();
		const getState = mkGetState({
			nested: { deep: { value: 'old-val' } },
		} as any);

		thunk(dispatch, getState, undefined as unknown);

		expect(dispatch).toHaveBeenCalledWith({
			type: 'SET',
			payload: 'new-val',
		});
	});
});
