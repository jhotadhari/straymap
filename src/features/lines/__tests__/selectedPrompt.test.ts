import {
	SELECTED_LINES_PROMPT_THRESHOLD,
	selectedWithoutSystemIds,
	shouldPromptSelectedCount,
} from '../utils/selectedPrompt';

describe('selectedPrompt utils', () => {
	it('prompts only above the threshold', () => {
		const many = new Array(SELECTED_LINES_PROMPT_THRESHOLD + 1).fill(0).map((_, i) => i + 1);
		const few = many.slice(0, SELECTED_LINES_PROMPT_THRESHOLD);
		expect(shouldPromptSelectedCount(many)).toBe(true);
		expect(shouldPromptSelectedCount(few)).toBe(false);
		expect(shouldPromptSelectedCount([])).toBe(false);
	});

	it('removes system lines from a selection', () => {
		const selected = [
			1,
			2,
			3,
			4,
			5,
		];
		const systemIds = [2, 5];
		expect(selectedWithoutSystemIds(selected, systemIds)).toEqual([
			1,
			3,
			4,
		]);
	});

	it('keeps the selection when there are no system lines', () => {
		const selected = [
			1,
			2,
			3,
		];
		expect(selectedWithoutSystemIds(selected, [])).toEqual([
			1,
			2,
			3,
		]);
	});
});
