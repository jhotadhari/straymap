/**
 * Tests for drawers utils — modal drag-end section resolution.
 */

/**
 * Internal dependencies
 */
import {
	DrawerSideItemKeys,
	getSectionEmptyKey,
	getSectionHeaderKey,
	reconstructSections,
	resolveDragEndSections,
	splitOrderIntoSections,
} from '../utils';

const HEADERS = {
	left: getSectionHeaderKey('left'),
	right: getSectionHeaderKey('right'),
	available: getSectionHeaderKey('available'),
};

const preSides: DrawerSideItemKeys = {
	left: ['L1', 'L2'],
	right: ['R1', 'R2'],
	available: ['A1'],
};

describe('splitOrderIntoSections', () => {
	it('splits a flat order by the header sentinels', () => {
		expect(
			splitOrderIntoSections([
				HEADERS.left,
				'L1',
				'L2',
				HEADERS.right,
				'R1',
				'R2',
				HEADERS.available,
				'A1',
			])
		).toEqual({
			left: ['L1', 'L2'],
			right: ['R1', 'R2'],
			available: ['A1'],
		});
	});

	it('assigns keys before the first header to available', () => {
		expect(
			splitOrderIntoSections([
				'A1',
				HEADERS.left,
				'L1',
			])
		).toEqual({
			left: ['L1'],
			right: [],
			available: ['A1'],
		});
	});
});

describe('reconstructSections', () => {
	it('keeps a within-section reorder untouched', () => {
		expect(
			reconstructSections({
				preSides,
				finalSides: { left: ['L2', 'L1'], right: ['R1', 'R2'], available: ['A1'] },
				draggedKey: 'L2',
			})
		).toEqual({
			left: ['L2', 'L1'],
			right: ['R1', 'R2'],
			available: ['A1'],
		});
	});

	it('moves an item displaced across a header back to its home section', () => {
		// L2 dropped onto R1: the lib's compaction moved R1 into the left
		// section. R1 must return to right at its pre-drag index.
		expect(
			reconstructSections({
				preSides,
				finalSides: { left: ['L1', 'R1'], right: ['L2', 'R2'], available: ['A1'] },
				draggedKey: 'L2',
			})
		).toEqual({
			left: ['L1'],
			right: [
				'R1',
				'L2',
				'R2',
			],
			available: ['A1'],
		});
	});

	it('moves multiple items displaced across multiple headers back home', () => {
		// L2 dragged past both headers: R1 crossed into left and A1 crossed
		// into right. Both return to their pre-drag sections.
		expect(
			reconstructSections({
				preSides,
				finalSides: { left: ['L1', 'R1'], right: ['R2', 'A1'], available: ['L2'] },
				draggedKey: 'L2',
			})
		).toEqual({
			left: ['L1'],
			right: ['R1', 'R2'],
			available: ['A1', 'L2'],
		});
	});

	it('drops an item into an empty section', () => {
		expect(
			reconstructSections({
				preSides: { left: ['L1'], right: [], available: ['A1'] },
				finalSides: { left: [], right: ['L1'], available: ['A1'] },
				draggedKey: 'L1',
			})
		).toEqual({
			left: [],
			right: ['L1'],
			available: ['A1'],
		});
	});
});

describe('resolveDragEndSections', () => {
	it('filters placeholder sentinels and repairs the sections', () => {
		expect(
			resolveDragEndSections({
				preSides: { left: ['L1'], right: [], available: ['A1'] },
				// L1 dropped into the (empty) right section: the placeholder
				// got displaced into the left section by the compaction.
				order: [
					HEADERS.left,
					getSectionEmptyKey('right'),
					HEADERS.right,
					'L1',
					HEADERS.available,
					'A1',
				],
				draggedKey: 'L1',
			})
		).toEqual({
			left: [],
			right: ['L1'],
			available: ['A1'],
		});
	});

	it('passes a clean within-section reorder through', () => {
		expect(
			resolveDragEndSections({
				preSides,
				order: [
					HEADERS.left,
					'L2',
					'L1',
					HEADERS.right,
					'R1',
					'R2',
					HEADERS.available,
					'A1',
				],
				draggedKey: 'L2',
			})
		).toEqual({
			left: ['L2', 'L1'],
			right: ['R1', 'R2'],
			available: ['A1'],
		});
	});
});
