/**
 * Internal dependencies
 */
import { DRAWER_WIDTH } from './constants';
import { DrawerSide } from './types';

export const getDrawerWidthResponsive = (windowWidth: number) => {
	return DRAWER_WIDTH <= (windowWidth * 2) / 3 ? DRAWER_WIDTH : (windowWidth * 2) / 3;
};

/**
 * Geometry helpers for the drawer-control modal's drag-and-drop.
 *
 * Every section and item row has a fixed height, so the drop target can be
 * derived from pure arithmetic on the vertical position — no measurement
 * needed. This keeps the math Fabric-safe (repeated UI-thread measure()
 * calls are unreliable on the new architecture).
 */

export interface SectionSize {
	side: DrawerSide;
	itemCount: number;
}

export interface SectionLayout extends SectionSize {
	top: number;
	height: number;
}

/**
 * Computes the absolute top offset and height of every section in the list.
 * Empty sections occupy a fixed minimum height so they stay droppable.
 */
export const getSectionLayouts = (
	sections: SectionSize[],
	headerHeight: number,
	itemHeight: number,
	emptySectionHeight: number
): SectionLayout[] => {
	let top = 0;
	return sections.map(({ side, itemCount }) => {
		const height = itemCount > 0 ? headerHeight + itemCount * itemHeight : emptySectionHeight;
		const layout: SectionLayout = { side, itemCount, top, height };
		top += height;
		return layout;
	});
};

/**
 * Absolute top offset of the item row at `index` in the given section.
 */
export const getRowTop = (
	layouts: SectionLayout[],
	side: DrawerSide,
	index: number,
	headerHeight: number,
	itemHeight: number
): number => {
	const layout = layouts.find(({ side: layoutSide }) => layoutSide === side);
	if (!layout) {
		return 0;
	}
	return layout.top + headerHeight + Math.max(0, index) * itemHeight;
};

/**
 * Derives the drop target (section + insertion index) from a vertical
 * position in the list. Positions past the last section land at the end
 * of the last section.
 */
export const computeDropTarget = (
	layouts: SectionLayout[],
	headerHeight: number,
	itemHeight: number,
	relY: number
): { side: DrawerSide; index: number } => {
	for (const layout of layouts) {
		if (relY < layout.top + layout.height) {
			if (0 === layout.itemCount) {
				return { side: layout.side, index: 0 };
			}
			const withinSectionY = relY - layout.top - headerHeight;
			const index = Math.max(
				0,
				Math.min(layout.itemCount, Math.round(withinSectionY / itemHeight))
			);
			return { side: layout.side, index };
		}
	}
	const last = layouts[layouts.length - 1];
	return last ? { side: last.side, index: last.itemCount } : { side: 'available', index: 0 };
};
