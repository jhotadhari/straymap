/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { selectIsRouting } from '../routing/selectors';
import { selectProfileLines } from '../lines/selectors';
import { getAltitudeProfileSourceKey } from '../altitudeProfile/types';
import { getBottomDrawerItem } from './dynamicItems';

export const selectInitialized = (state: RootState) => state.bottomDrawer.initialized;

export const selectActiveKey = (state: RootState) => state.bottomDrawer.activeKey;

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.bottomDrawer.itemKeys,
	(state: RootState) => selectIsRouting(state),
	(state: RootState) => selectProfileLines(state),
	(itemKeys, isRouting, profileLines): string[] => {
		// Derived keys: altitude profile sources (routing while active,
		// one per line with a profile enabled). Not persisted — derived
		// from the owning features' state.
		const derivedKeys: string[] = [];
		if (isRouting) {
			derivedKeys.push(getAltitudeProfileSourceKey.routing());
		}
		profileLines.forEach((lineId) => {
			derivedKeys.push(getAltitudeProfileSourceKey.line(lineId));
		});

		const allKeys = [...itemKeys, ...derivedKeys];

		// Filter against static + dynamically resolved items so stale
		// persisted keys don't produce broken handles/entries.
		return allKeys.filter((key) => !!getBottomDrawerItem(key));
	}
);
