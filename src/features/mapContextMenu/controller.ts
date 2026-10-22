/**
 * Internal dependencies
 */
import type { MapContextMenuContext } from '../../types';

/**
 * Lightweight event hub between the map event handlers (AppView) and the
 * context-menu overlay. Kept out of Redux because the menu is transient
 * UI state — no persistence, no cross-feature state implications.
 */

export type SharePositionState = {
	lng: number;
	lat: number;
} | null;

type MenuListener = (context: MapContextMenuContext) => void;
type SharePositionListener = (state: SharePositionState) => void;

const menuListeners = new Set<MenuListener>();
const sharePositionListeners = new Set<SharePositionListener>();

export const emitMapContextMenu = (context: MapContextMenuContext): void => {
	menuListeners.forEach((listener) => listener(context));
};

export const subscribeMapContextMenu = (listener: MenuListener): (() => void) => {
	menuListeners.add(listener);
	return () => {
		menuListeners.delete(listener);
	};
};

export const openSharePosition = (lng: number, lat: number): void => {
	sharePositionListeners.forEach((listener) => listener({ lng, lat }));
};

export const closeSharePosition = (): void => {
	sharePositionListeners.forEach((listener) => listener(null));
};

export const subscribeSharePosition = (listener: SharePositionListener): (() => void) => {
	sharePositionListeners.add(listener);
	return () => {
		sharePositionListeners.delete(listener);
	};
};
