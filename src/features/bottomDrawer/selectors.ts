/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { featureRegistry } from '../FeatureRegistry';
import { BottomDrawerItem } from './types';

export const selectInitialized = (state: RootState) => state.bottomDrawer.initialized;

export const selectActiveKey = (state: RootState) => state.bottomDrawer.activeKey;

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.bottomDrawer.itemKeys,
	(itemKeys): string[] =>
		itemKeys.filter((key) =>
			Object.keys(
				featureRegistry.getBottomDrawerItems() as { [itemKey: string]: BottomDrawerItem }
			).includes(key)
		)
);
