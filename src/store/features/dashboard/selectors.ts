/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

import * as elements from './elements';
import { DashboardItem } from './types';

export const selectInitialized = (state: RootState) => state.dashboard.initialized;

export const selectDashboardStyle = (state: RootState) => state.dashboard.dashboardStyle;

export const selectItemByKey = <Options = {}>(state: RootState, key?: string) : {
	position: string;
	item: undefined | DashboardItem<Options>;
} => {
	let position = 'top';
	let item = !key ? undefined : state.dashboard.itemsTop.find((item) => item.key === key) as undefined | DashboardItem<Options>;
	if (key && !item) {
		position = 'bottom';
		item = state.dashboard.itemsBottom.find((item) => item.key === key) as undefined | DashboardItem<Options>;
	}
	return {
		item,
		position,
	};
};

export const selectEditItemKey = (state: RootState) =>
	state.dashboard.editItemKey;

export const selectEditItem = <Options = {}>(state: RootState) =>
	selectItemByKey<Options>(state, state.dashboard.editItemKey);

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
