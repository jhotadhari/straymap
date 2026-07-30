/**
 * External dependencies
 */
import { useMemo } from 'react';

const LINE_COUNT_THRESHOLD = 500;
const FIXED_ROW_HEIGHT = 50;

/**
 * When the row count exceeds {@link LINE_COUNT_THRESHOLD}, rows lock to a
 * fixed height so {@code getItemLayout} can provide O(1) offset lookups
 * for fast fling-scrolling through large datasets. Below the threshold,
 * rows may grow naturally (wrapping text, expanding tags).
 */
export function useFixedRowHeight(lineCount: number) {
	const isFixedHeight = lineCount > LINE_COUNT_THRESHOLD;

	const rowHeight = isFixedHeight ? FIXED_ROW_HEIGHT : undefined;

	const getItemLayout = useMemo(
		() =>
			isFixedHeight
				? (_data: unknown, index: number) => ({
						length: FIXED_ROW_HEIGHT,
						offset: FIXED_ROW_HEIGHT * index,
						index,
					})
				: undefined,
		[isFixedHeight]
	);

	return useMemo(() => ({ isFixedHeight, rowHeight, getItemLayout }), [isFixedHeight, rowHeight, getItemLayout]);
}
