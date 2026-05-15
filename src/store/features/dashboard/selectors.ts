/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

import * as elements from './elements';
import { DashboardItem } from './types';

export const selectInitialized = (state: RootState) => state.dashboard.initialized;

export const selectIsEditingDashboard = (state: RootState) => state.dashboard.isEditingDashboard;

export const selectDashboardStyle = (state: RootState) => state.dashboard.dashboardStyle;

export const selectItemByKey = <Options = {}>(state: RootState, key?: string) : {
	position: string;
	idx: number;
	item: undefined | DashboardItem<Options>;
} => {
	let position = 'top';
	let idx = !key ? -1 : state.dashboard.itemsTop.findIndex((item) => item.key === key);
	let item : undefined | DashboardItem<Options> = undefined;
	if (key && -1 === idx ) {
		position = 'bottom';
		idx = !key ? -1 : state.dashboard.itemsBottom.findIndex((item) => item.key === key);
	}
	if ( key && -1 !== idx ) {
		item = ( 'top' === position ? state.dashboard.itemsTop : state.dashboard.itemsBottom )[idx];
	}
	return {
		item,
		idx,
		position,
	};
};

export const selectItemsCount = (state: RootState, position?: string) => {
	if ( 'top' === position) {
		return state.dashboard.itemsTop.length;
	} else if ('bottom' === position) {
		return state.dashboard.itemsBottom.length;
	} else {
		return state.dashboard.itemsTop.length + state.dashboard.itemsBottom.length;
	}
}

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
