/**
 * Shared line-width bounds and clamping for every feature that renders a
 * line with a user-configurable width (lines, routing, recording). Keep
 * in one place so the pickers and the reducers clamp identically.
 */

export const LINE_WIDTH_MIN = 1;

export const LINE_WIDTH_MAX = 8;

/** Width step between preset values (half-steps). */
export const LINE_WIDTH_STEP = 0.5;

export const clampLineWidth = (width: number): number =>
	Math.min(
		LINE_WIDTH_MAX,
		Math.max(LINE_WIDTH_MIN, Math.round(width / LINE_WIDTH_STEP) * LINE_WIDTH_STEP)
	);
