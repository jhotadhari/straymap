/**
 * Startup prompt for very large restored map selections.
 */

/** More than this many restored selected lines triggers the prompt. */
export const SELECTED_LINES_PROMPT_THRESHOLD = 500;

export const shouldPromptSelectedCount = (selected: number[]): boolean =>
	selected.length > SELECTED_LINES_PROMPT_THRESHOLD;

/**
 * The selection minus system lines (recording, routing, …) — clearing
 * the map must never remove system lines.
 */
export const selectedWithoutSystemIds = (selected: number[], systemIds: number[]): number[] => {
	const systemSet = new Set(systemIds);
	return selected.filter((id) => !systemSet.has(id));
};
