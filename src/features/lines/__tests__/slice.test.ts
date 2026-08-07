/**
 * Tests for lines slice reducers, thunks, and selectors.
 */

/**
 * Internal dependencies
 */
import linesReducer, {
	setInitialized,
	setSelected,
	setLineTemp,
	setLineSelected,
	setLinesSelected,
	onSetDbPath,
	initialSettings,
} from '../slice';
import type { LinesState } from '../slice';
import { selectInitialized, selectLineTemp, selectSelected } from '../selectors';
import type { RootState } from '../../../store/store';

const buildRoot = (overrides: Partial<LinesState> = {}) =>
	({
		lines: {
			initialized: false,
			...initialSettings,
			...overrides,
		},
	}) as RootState;

// ===========================================================================
// Reducers
// ===========================================================================

describe('lines slice reducers', () => {
	it('setInitialized', () => {
		const state = linesReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setLineTemp sets the lineTemp', () => {
		const lineTemp = { id: 1, title: 'Test Line' };
		const state = linesReducer(undefined, setLineTemp(lineTemp));
		expect(state.lineTemp).toEqual(lineTemp);
	});

	it('setLineTemp clears lineTemp', () => {
		const state = linesReducer(
			{
				initialized: false,
				...initialSettings,
				lineTemp: { id: 1 },
			} as LinesState,
			setLineTemp(undefined)
		);
		expect(state.lineTemp).toBeUndefined();
	});

	it('setSelected sorts by id', () => {
		const state = linesReducer(
			undefined,
			setSelected([
				3,
				1,
				2,
			])
		);
		expect(state.selected).toEqual([
			1,
			2,
			3,
		]);
	});

	it('setSelected uses uniq which deduplicates values', () => {
		const state = linesReducer(
			undefined,
			setSelected([
				1,
				1,
				2,
			])
		);
		expect(state.selected).toEqual([1, 2]);
	});

	it('setSelected handles empty array', () => {
		const state = linesReducer(undefined, setSelected([]));
		expect(state.selected).toEqual([]);
	});

	it('initial state has empty selected', () => {
		const state = linesReducer(undefined, { type: '@@INIT' });
		expect(state.selected).toEqual([]);
		expect(state.initialized).toBe(false);
	});
});

// ===========================================================================
// Thunks
// ===========================================================================

describe('lines thunks', () => {
	describe('setLineSelected', () => {
		it('adds line to selected when not present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [] }));

			setLineSelected(1)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [1],
				})
			);
		});

		it('removes line from selected when present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [1] }));

			setLineSelected(1)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [],
				})
			);
		});

		it('no-op when isSelected matches current state (already selected)', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [1] }));

			setLineSelected(1, true)(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});

		it('no-op when isSelected matches current state (already not selected)', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [] }));

			setLineSelected(1, false)(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe('setLinesSelected', () => {
		it('bulk replaces selected with sorted ids', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [1] }));

			setLinesSelected([2, 1])(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [1, 2],
				})
			);
		});

		it('no-op when selected matches exactly', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [1] }));

			setLinesSelected([1])(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe('onSetDbPath', () => {
		it('dispatches setSelected with empty array', () => {
			const dispatch = jest.fn();
			onSetDbPath()(dispatch, jest.fn(), undefined as any);
			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [],
				})
			);
		});
	});
});

// ===========================================================================
// Selectors
// ===========================================================================

describe('lines selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectLineTemp returns undefined when not set', () => {
		expect(selectLineTemp(buildRoot({}))).toBeUndefined();
	});

	it('selectLineTemp returns lineTemp', () => {
		expect(selectLineTemp(buildRoot({ lineTemp: { id: 5 } }))).toEqual({
			id: 5,
		});
	});

	it('selectSelected returns selected IDs as-is', () => {
		const state = buildRoot({
			selected: [
				1,
				2,
				2,
				3,
			],
		});
		const result = selectSelected(state);
		expect(result).toEqual([
			1,
			2,
			2,
			3,
		]);
	});
});
