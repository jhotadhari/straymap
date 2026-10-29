/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { featureRegistry } from '../FeatureRegistry';
import { DrawerPanel, DrawerSide } from './types';

export const selectInitialized = (state: RootState) => state.drawers.initialized;

export const selectSortable = (state: RootState) => state.drawers.sortable;

export const selectActiveKey = (state: RootState, { side }: { side: string }) => {
	if ('left' === side) {
		return state.drawers.activeKeyLeft;
	}
	if ('right' === side) {
		return state.drawers.activeKeyRight;
	}
	return undefined;
};

const getRegisteredItemKeys = (): string[] =>
	Object.keys(featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel });

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.drawers.itemKeysLeft,
	(state: RootState) => state.drawers.itemKeysRight,
	(state: RootState) => state.drawers.itemKeysAvailable,
	(_state: RootState, { side }: { side: string }) => side,
	(itemKeysLeft, itemKeysRight, itemKeysAvailable, side): string[] => {
		const registeredItemKeys = getRegisteredItemKeys();
		let itemKeys: string[] = [];
		if ('left' === side) {
			itemKeys = itemKeysLeft;
		} else if ('right' === side) {
			itemKeys = itemKeysRight;
		} else if ('available' === side) {
			// Persisted order first, then registry keys missing from all
			// sides appended at the end — newly registered panels always
			// become visible in the available section.
			const missingItemKeys = registeredItemKeys.filter(
				(key) =>
					!itemKeysLeft.includes(key) &&
					!itemKeysRight.includes(key) &&
					!itemKeysAvailable.includes(key)
			);
			itemKeys = [...itemKeysAvailable, ...missingItemKeys];
		}
		return itemKeys.filter((key) => registeredItemKeys.includes(key));
	}
);

export const selectSideForKey = createAppSelector(
	(state: RootState) => state.drawers.itemKeysLeft,
	(state: RootState) => state.drawers.itemKeysRight,
	(_state: RootState, key: string) => key,
	(itemKeysLeft, itemKeysRight, key): DrawerSide | undefined => {
		if (itemKeysLeft.includes(key)) {
			return 'left';
		}
		if (itemKeysRight.includes(key)) {
			return 'right';
		}
		return undefined;
	}
);
