/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { selectIsRouting, selectRoutingLineId } from '../routing/selectors';
import { selectProfileLines, selectSelected } from '../lines/selectors';
import { getAltitudeProfileSourceKey } from '../altitudeProfile/types';
import { getBottomDrawerItem } from './dynamicItems';

export const selectInitialized = (state: RootState) => state.bottomDrawer.initialized;

export const selectActiveKey = (state: RootState) => state.bottomDrawer.activeKey;

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.bottomDrawer.itemKeys,
	(state: RootState) => selectIsRouting(state),
	(state: RootState) => selectProfileLines(state),
	(state: RootState) => selectRoutingLineId(state),
	(state: RootState) => selectSelected(state),
	(itemKeys, isRouting, profileLines, routingLineId, selectedLineIds): string[] => {
		// Derived keys: altitude profile sources (routing while active,
		// one per line that has a profile enabled AND is on the map).
		// Not persisted — derived from the owning features' state.
		const derivedKeys: string[] = [];
		if (isRouting) {
			derivedKeys.push(getAltitudeProfileSourceKey.routing());
		}
		profileLines.forEach((lineId) => {
			// Only lines currently on the map get a profile entry; the
			// routing line is already covered by the routing key.
			if (lineId === routingLineId || !selectedLineIds.includes(lineId)) {
				return;
			}
			derivedKeys.push(getAltitudeProfileSourceKey.line(lineId));
		});

		const allKeys = [...itemKeys, ...derivedKeys];

		// Filter against static + dynamically resolved items so stale
		// persisted keys don't produce broken handles/entries.
		return allKeys.filter((key) => !!getBottomDrawerItem(key));
	}
);
