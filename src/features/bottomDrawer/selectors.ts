/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { selectIsRouting, selectRoutingLineId } from '../routing/selectors';
import { selectChartLines, selectSelected } from '../lines/selectors';
import { selectIsRecording, selectActiveLineId } from '../trackRecording/selectors';
import { selectFollowingLineId } from '../lineFollow/selectors';
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
	(state: RootState) => selectIsRecording(state),
	(state: RootState) => selectActiveLineId(state),
	(state: RootState) => selectFollowingLineId(state),
	(
		itemKeys,
		isRouting,
		chartLines,
		routingLineId,
		selectedLineIds,
		isRecording,
		activeLineId,
		followingLineId
	): string[] => {
		// Derived keys — one chart per line. A line can be the routing
		// line, the active recording line, the followed line, or a plain
		// selected line with a user-enabled chart; the Set dedupes so a
		// line never contributes more than one chart entry.
		const derivedKeys: string[] = [];
		const covered = new Set<number>();

		if (isRouting && routingLineId != null && !covered.has(routingLineId)) {
			covered.add(routingLineId);
			derivedKeys.push(getChartSourceKey.line(routingLineId));
		}
		if (isRecording && activeLineId != null && !covered.has(activeLineId)) {
			covered.add(activeLineId);
			derivedKeys.push(getChartSourceKey.line(activeLineId));
		}
		if (followingLineId != null && !covered.has(followingLineId)) {
			covered.add(followingLineId);
			derivedKeys.push(getChartSourceKey.line(followingLineId));
		}

		chartLines.forEach((lineId) => {
			// Only lines currently on the map get a chart entry; feature
			// lines (routing / recording / followed) are already covered.
			if (covered.has(lineId) || !selectedLineIds.includes(lineId)) {
				return;
			}
			covered.add(lineId);
			derivedKeys.push(getChartSourceKey.line(lineId));
		});

		const allKeys = [...itemKeys, ...derivedKeys];

		// Filter against static + dynamically resolved items so stale
		// persisted keys don't produce broken handles/entries.
		return allKeys.filter((key) => !!getBottomDrawerItem(key));
	}
);
