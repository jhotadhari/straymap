/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';
import { featureRegistry } from '../FeatureRegistry';
import { DrawerPanel } from './types';

export const selectInitialized = (state: RootState) => state.drawers.initialized;

export const selectControlHandleSide = (state: RootState) => state.drawers.controlHandleSide;

export const selectShowSettingsHandle = (state: RootState) => state.drawers.showSettingsHandle;

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
			Object.keys(
				featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel }
			).includes(key)
		);
	}
);

export const selectSideForKey = createAppSelector(
	(state: RootState) => state.drawers.itemKeysLeft,
	(state: RootState) => state.drawers.itemKeysRight,
	(_state: RootState, key: string) => key,
	(itemKeysLeft, itemKeysRight, key): string | undefined => {
		if (itemKeysLeft.includes(key)) {
			return 'left';
		}
		if (itemKeysRight.includes(key)) {
			return 'right';
		}
		return undefined;
	}
);
