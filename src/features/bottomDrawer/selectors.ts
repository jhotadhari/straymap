/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { selectIsRouting, selectRoutingLineId } from '../routing/selectors';
import { selectChartLines, selectSelected } from '../lines/selectors';
import { getChartSourceKey } from '../chart/types';
import { getBottomDrawerItem } from './dynamicItems';

export const selectInitialized = (state: RootState) => state.bottomDrawer.initialized;

export const selectActiveKey = (state: RootState) => state.bottomDrawer.activeKey;

export const selectItemKeys = createAppSelector(
	(state: RootState) => state.bottomDrawer.itemKeys,
	(state: RootState) => selectIsRouting(state),
	(state: RootState) => selectChartLines(state),
	(state: RootState) => selectRoutingLineId(state),
	(state: RootState) => selectSelected(state),
	(itemKeys, isRouting, chartLines, routingLineId, selectedLineIds): string[] => {
		// Derived keys: chart sources (routing while active,
		// one per line that has a chart enabled AND is on the map).
		// Not persisted — derived from the owning features' state.
		const derivedKeys: string[] = [];
		if (isRouting) {
			derivedKeys.push(getChartSourceKey.routing());
		}
		chartLines.forEach((lineId) => {
			// Only lines currently on the map get a chart entry; the
			// routing line is already covered by the routing key.
			if (lineId === routingLineId || !selectedLineIds.includes(lineId)) {
				return;
			}
			derivedKeys.push(getChartSourceKey.line(lineId));
		});

		const allKeys = [...itemKeys, ...derivedKeys];

		// Filter against static + dynamically resolved items so stale
		// persisted keys don't produce broken handles/entries.
		return allKeys.filter((key) => !!getBottomDrawerItem(key));
	}
);
