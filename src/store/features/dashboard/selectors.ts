/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

import { DashboardItem } from './types';

export const selectInitialized = (state: RootState) => state.dashboard.initialized;

export const selectElementsSettings = (state: RootState) => state.dashboard.elementsSettings;

export const selectIsEditingDashboard = (state: RootState) => state.dashboard.isEditingDashboard;

// export const selectDashboardStyle = (state: RootState) => state.dashboard.dashboardStyle;

export const selectDashboardStyle = (state: RootState, position?: string) => {
	if ('top' === position) {
		return state.dashboard.dashboardStyleTop;
	} else {
		return state.dashboard.dashboardStyleBottom;
	}
};

export const selectItemsCount = (state: RootState, position?: string) => {
	if ('top' === position) {
		return state.dashboard.itemsTop.length;
	} else if ('bottom' === position) {
		return state.dashboard.itemsBottom.length;
	} else {
		return state.dashboard.itemsTop.length + state.dashboard.itemsBottom.length;
	}
};

export const selectEditItemKey = (state: RootState) => state.dashboard.editItemKey;

export const getItemByKeyResultFn = (
	itemsTop: DashboardItem[],
	itemsBottom: DashboardItem[],
	key?: string
): {
	position: string;
	idx: number;
	item: undefined | DashboardItem;
} => {
	let position = 'top';
	let idx = !key ? -1 : itemsTop.findIndex((item) => item.key === key);
	let item: undefined | DashboardItem = undefined;
	if (key && -1 === idx) {
		position = 'bottom';
		idx = !key ? -1 : itemsBottom.findIndex((item) => item.key === key);
	}
	if (key && -1 !== idx) {
		item = ('top' === position ? itemsTop : itemsBottom)[idx];
	}
	return {
		item,
		idx,
		position,
	};
};

export const selectItemByKey = createAppSelector(
	(state: RootState) => state.dashboard.itemsTop,
	(state: RootState) => state.dashboard.itemsBottom,
	(_state: RootState, key: string) => key,
	getItemByKeyResultFn
);

export const selectEditItem = createAppSelector(
	(state: RootState) => selectEditItemKey(state),
	(state: RootState) => state.dashboard.itemsTop,
	(state: RootState) => state.dashboard.itemsBottom,
	(editItemKey, itemsTop, itemsBottom) => {
		return getItemByKeyResultFn(itemsTop, itemsBottom, editItemKey);
	}
);

export const selectItems = createAppSelector(
	(state: RootState) => selectElementsSettings(state),
	(state: RootState) => state.dashboard.itemsTop,
	(state: RootState) => state.dashboard.itemsBottom,
	(_state: RootState, { position }: { position: string }) => position,
	(elementsSettings, itemsTop, itemsBottom, position): DashboardItem[] => {
		let items: DashboardItem[] = [];
		if ('top' === position) {
			items = itemsTop;
		} else if ('bottom' === position) {
			items = itemsBottom;
		}
		return items.filter((item) => Object.keys(elementsSettings).includes(item.elementType));
	}
);
