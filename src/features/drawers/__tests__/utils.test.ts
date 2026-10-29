/**
 * Tests for drawers utils — modal drag-and-drop geometry.
 */

/**
 * Internal dependencies
 */
import { computeDropTarget, getRowTop, getSectionLayouts, SectionSize } from '../utils';

const HEADER = 40;
const ITEM = 62;
const EMPTY = 76;

const SECTIONS: SectionSize[] = [
	{ side: 'left', itemCount: 2 },
	{ side: 'right', itemCount: 1 },
	{ side: 'available', itemCount: 0 },
];

describe('getSectionLayouts', () => {
	it('stacks sections with fixed geometry', () => {
		const layouts = getSectionLayouts(SECTIONS, HEADER, ITEM, EMPTY);
		expect(layouts).toEqual([
			{ side: 'left', itemCount: 2, top: 0, height: HEADER + 2 * ITEM },
			{
				side: 'right',
				itemCount: 1,
				top: HEADER + 2 * ITEM,
				height: HEADER + ITEM,
			},
			{
				side: 'available',
				itemCount: 0,
				top: HEADER + 2 * ITEM + HEADER + ITEM,
				height: EMPTY,
			},
		]);
	});

	it('uses the empty height for sections without items', () => {
		const layouts = getSectionLayouts(
			[{ side: 'available', itemCount: 0 }],
			HEADER,
			ITEM,
			EMPTY
		);
		expect(layouts[0]).toEqual({ side: 'available', itemCount: 0, top: 0, height: EMPTY });
	});
});

describe('getRowTop', () => {
	it('returns the row offset within the section', () => {
		const layouts = getSectionLayouts(SECTIONS, HEADER, ITEM, EMPTY);
		expect(getRowTop(layouts, 'left', 0, HEADER, ITEM)).toBe(0 + HEADER);
		expect(getRowTop(layouts, 'left', 1, HEADER, ITEM)).toBe(0 + HEADER + ITEM);
		expect(getRowTop(layouts, 'right', 0, HEADER, ITEM)).toBe(HEADER + 2 * ITEM + HEADER);
	});

	it('returns 0 for an unknown side', () => {
		const layouts = getSectionLayouts(SECTIONS, HEADER, ITEM, EMPTY);
		expect(getRowTop(layouts, 'nonexistent' as any, 0, HEADER, ITEM)).toBe(0);
	});
});

describe('computeDropTarget', () => {
	const layouts = getSectionLayouts(SECTIONS, HEADER, ITEM, EMPTY);

	it('lands in the first section at index 0', () => {
		expect(computeDropTarget(layouts, HEADER, ITEM, 0)).toEqual({ side: 'left', index: 0 });
	});

	it('lands in the first section at index 1', () => {
		expect(computeDropTarget(layouts, HEADER, ITEM, HEADER + ITEM)).toEqual({
			side: 'left',
			index: 1,
		});
	});

	it('lands at the end of the first section', () => {
		expect(computeDropTarget(layouts, HEADER, ITEM, HEADER + 2 * ITEM - 1)).toEqual({
			side: 'left',
			index: 2,
		});
	});

	it('lands in the second section', () => {
		expect(
			computeDropTarget(layouts, HEADER, ITEM, HEADER + 2 * ITEM + HEADER + ITEM / 2)
		).toEqual({ side: 'right', index: 1 });
	});

	it('lands in an empty section at index 0', () => {
		const emptyTop = HEADER + 2 * ITEM + HEADER + ITEM;
		expect(computeDropTarget(layouts, HEADER, ITEM, emptyTop + EMPTY / 2)).toEqual({
			side: 'available',
			index: 0,
		});
	});

	it('clamps positions past the last section to its end', () => {
		expect(computeDropTarget(layouts, HEADER, ITEM, 99999)).toEqual({
			side: 'available',
			index: 0,
		});
	});
});
