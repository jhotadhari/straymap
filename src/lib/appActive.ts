/**
 * External dependencies
 */
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Process-scoped "is the app visible" signal.
 *
 * Map work that nobody can see (re-centering on GNSS fixes, refreshing the
 * growing recording line, …) is skipped while the app is backgrounded and
 * caught up once when it becomes active again.
 *
 * Android only reports 'active' / 'background' — anything but 'background'
 * (incl. the initial 'unknown' at JS start) counts as active.
 */

type Listener = (active: boolean) => void;

const toActive = (state: AppStateStatus | null | undefined) => state !== 'background';

let active = toActive(AppState.currentState);
const listeners = new Set<Listener>();
let subscribed = false;

const ensureSubscribed = (): void => {
	if (subscribed) {
		return;
	}
	subscribed = true;
	AppState.addEventListener('change', (state) => {
		const next = toActive(state);
		if (next === active) {
			return;
		}
		active = next;
		listeners.forEach((listener) => listener(next));
	});
};

/** Current visibility, readable from anywhere (thunks, listeners, refs). */
export const isAppActive = (): boolean => {
	ensureSubscribed();
	return active;
};

/** Called with the new value on every active ↔ background transition. */
export const subscribeAppActive = (listener: Listener): (() => void) => {
	ensureSubscribed();
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/** React hook — re-renders on active ↔ background transitions. */
export const useIsAppActive = (): boolean =>
	useSyncExternalStore((onChange) => subscribeAppActive(() => onChange()), isAppActive);
