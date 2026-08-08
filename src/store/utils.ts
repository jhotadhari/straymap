/**
 * External dependencies
 */
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import { RootState, AppThunk } from './store';

export const getSetterThunkWithGetter = <T>(
	selector: (state: RootState) => T,
	setter: ActionCreatorWithPayload<T, any>
) => {
	return (newValueOrGetter: T | ((currentValue: T) => T)): AppThunk => {
		return (dispatch, getState) => {
			const currentValue = selector(getState());
			const newValue: T =
				newValueOrGetter instanceof Function
					? newValueOrGetter(currentValue)
					: newValueOrGetter;
			dispatch(setter(newValue));
		};
	};
};
