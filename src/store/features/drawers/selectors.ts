/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';
import * as drawerItems from './items';
import { DrawerItem } from './types';

export const selectInitialized = (state: RootState) => state.drawers.initialized;

export const selectControlHandleSide = (state: RootState) => state.drawers.controlHandleSide;

export const selectActiveKey = (state: RootState, { side }: { side: string }) => {
	if ('left' === side) {
		return state.drawers.activeKeyLeft;
	}
	if ('right' === side) {
		return state.drawers.activeKeyRight;
	}
	return undefined;
};

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.drawers.itemKeysLeft,
	(state: RootState) => state.drawers.itemKeysRight,
	(_state: RootState, { side }: { side: string }) => side,
	(itemKeysLeft, itemKeysRight, side): string[] => {
		let itemKeys: string[] = [];
		if ('left' === side) {
			itemKeys = itemKeysLeft;
		} else if ('right' === side) {
			itemKeys = itemKeysRight;
		}
		return itemKeys.filter((key) =>
			Object.keys(drawerItems as { [itemKey: string]: DrawerItem }).includes(key)
		);
	}
);
