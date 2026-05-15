/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

import * as elements from './elements';
import { DashboardItem } from './types';

export const selectInitialized = (state: RootState) => state.dashboard.initialized;

export const selectDashboardStyle = (state: RootState) => state.dashboard.dashboardStyle;

export const selectItemByKey = (state: RootState, key?: string) => {
	let position = 'top';
	let editItem = !key ? undefined : state.dashboard.itemsTop.find((item) => item.key === key);
	if (key && !editItem) {
		position = 'bottom';
		editItem = state.dashboard.itemsBottom.find((item) => item.key === key);
	}
	return {
		editItem,
		position,
	};
};

export const selectEditItemKey = (state: RootState) =>
	state.dashboard.editItemKey;

export const selectEditItem = (state: RootState) =>
	selectItemByKey(state, state.dashboard.editItemKey);

export const selectItems = createAppSelector(
	(state: RootState) => state.dashboard.itemsTop,
	(state: RootState) => state.dashboard.itemsBottom,
	(_state: RootState, { position }: { position: string }) => position,
	(itemsTop, itemsBottom, position): DashboardItem[] => {
		let items: DashboardItem[] = [];
		if ('top' === position) {
			items = itemsTop;
		} else if ('bottom' === position) {
			items = itemsBottom;
		}
		return items.filter((item) =>
			Object.keys(elements as { [itemKey: string]: any }).includes(item.elementType)
		);
	}
);
