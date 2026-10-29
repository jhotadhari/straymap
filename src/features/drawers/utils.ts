/**
 * Internal dependencies
 */
import { DRAWER_WIDTH } from './constants';
import { DrawerSide } from './types';

export const getDrawerWidthResponsive = (windowWidth: number) => {
	return DRAWER_WIDTH <= (windowWidth * 2) / 3 ? DRAWER_WIDTH : (windowWidth * 2) / 3;
};

/**
 * Helpers for the drawer-control modal's drag-and-drop.
 *
 * The modal renders all sections inside a single Sortable.Flex. Section
 * headers are fixed-order sentinel items and empty sections contribute a
 * non-draggable placeholder item, so the library's final order contains
 * both real item keys and sentinels. These helpers split that order back
 * into the three sections and repair the library's compaction artifact:
 * `reorderInsert` skips fixed items while compacting the displaced chain
 * toward the source, which pushes exactly one item per crossed header into
 * the section above. `resolveDragEndSections` moves those displaced items
 * back to their pre-drag sections.
 */

export const SECTION_HEADER_KEY_PREFIX = '__header_';
export const SECTION_EMPTY_KEY_PREFIX = '__empty_';

export const getSectionHeaderKey = (side: DrawerSide) => `${SECTION_HEADER_KEY_PREFIX}${side}`;
export const getSectionEmptyKey = (side: DrawerSide) => `${SECTION_EMPTY_KEY_PREFIX}${side}`;

export type DrawerSideItemKeys = Record<DrawerSide, string[]>;

const DRAWER_SIDES: DrawerSide[] = [
	'left',
	'right',
	'available',
];

/**
 * Splits a flat key order (with header sentinels) into the three sections.
 */
export const splitOrderIntoSections = (order: string[]): DrawerSideItemKeys => {
	const result: DrawerSideItemKeys = {
		left: [],
		right: [],
		available: [],
	};
	let currentSide: DrawerSide = 'available';
	order.forEach((key) => {
		const headerSide = DRAWER_SIDES.find((side) => getSectionHeaderKey(side) === key);
		if (headerSide) {
			currentSide = headerSide;
			return;
		}
		result[currentSide].push(key);
	});
	return result;
};

/**
 * Repairs the section membership after a drag: every item that ended up in
 * a section other than its pre-drag one — except the dragged item itself —
 * returns to its pre-drag section at its pre-drag index.
 */
export const reconstructSections = ({
	preSides,
	finalSides,
	draggedKey,
}: {
	preSides: DrawerSideItemKeys;
	finalSides: DrawerSideItemKeys;
	draggedKey: string;
}): DrawerSideItemKeys => {
	const result: DrawerSideItemKeys = {
		left: [],
		right: [],
		available: [],
	};

	// Keep only the keys that belong in each section; collect the rest.
	const displaced: { key: string; home: DrawerSide; index: number }[] = [];
	DRAWER_SIDES.forEach((side) => {
		finalSides[side].forEach((key) => {
			if (key === draggedKey || preSides[side].includes(key)) {
				result[side].push(key);
			} else {
				const home = DRAWER_SIDES.find((homeSide) => preSides[homeSide].includes(key));
				if (home) {
					displaced.push({
						key,
						home,
						index: preSides[home].indexOf(key),
					});
				}
			}
		});
	});

	// Re-insert displaced items into their home sections in pre-drag order.
	displaced
		.sort((a, b) => a.index - b.index)
		.forEach(({ key, home, index }) => {
			const targetIndex = Math.max(0, Math.min(index, result[home].length));
			result[home].splice(targetIndex, 0, key);
		});

	return result;
};

/**
 * Full drag-end pipeline: strip placeholders, split the final order by
 * header sentinels, and repair the compaction artifact.
 */
export const resolveDragEndSections = ({
	preSides,
	order,
	draggedKey,
}: {
	preSides: DrawerSideItemKeys;
	order: string[];
	draggedKey: string;
}): DrawerSideItemKeys => {
	const cleanedOrder = order.filter((key) => !key.startsWith(SECTION_EMPTY_KEY_PREFIX));
	const finalSides = splitOrderIntoSections(cleanedOrder);
	return reconstructSections({ preSides, finalSides, draggedKey });
};
