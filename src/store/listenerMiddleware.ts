/**
 * External dependencies
 */
import { createListenerMiddleware, addListener, UnknownAction } from '@reduxjs/toolkit';

/**
 * Internal dependencies
 */
import type { RootState, AppDispatch } from './store';

declare type ExtraArgument = {
	// foo: string,
};

export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
	RootState,
	AppDispatch,
	ExtraArgument
>();

export const addAppListener = addListener.withTypes<RootState, AppDispatch>();

if (__DEV__ && globalThis.shouldLog.dispatchAction) {
	startAppListening({
		predicate: () => true,
		effect: async (action: UnknownAction) => {
			if (
				true === globalThis.shouldLog.dispatchAction ||
				(Array.isArray(globalThis.shouldLog.dispatchAction) &&
					globalThis.shouldLog.dispatchAction.includes(action.type))
			) {
				console.log('DEBUG dispatch action', action?.type, action?.payload); // debug
			}
		},
	});
}
