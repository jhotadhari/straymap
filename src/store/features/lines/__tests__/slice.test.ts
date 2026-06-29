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
	setLineVisible,
	setLineSelected,
	setLinesSelected,
	onSetDbPath,
	initialSettings,
} from '../slice';
import type { LinesState } from '../slice';
import {
	selectInitialized,
	selectLineTemp,
	selectSelected,
	selectSelectedInfos,
} from '../selectors';
import type { RootState } from '../../../store';

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
			{ initialized: false, selected: [], lineTemp: { id: 1 } } as LinesState,
			setLineTemp(undefined)
		);
		expect(state.lineTemp).toBeUndefined();
	});

	it('setSelected sorts by id', () => {
		const state = linesReducer(
			undefined,
			setSelected([
				{ id: 3, visible: true },
				{ id: 1, visible: false },
				{ id: 2, visible: true },
			])
		);
		expect(state.selected).toEqual([
			{ id: 1, visible: false },
			{ id: 2, visible: true },
			{ id: 3, visible: true },
		]);
	});

	it('setSelected uses uniq which deduplicates by reference (not by id)', () => {
		// lodash uniq uses SameValueZero — same object reference = duplicate
		const duplicateRef = { id: 1, visible: true };
		const state = linesReducer(
			undefined,
			setSelected([
				duplicateRef,
				duplicateRef,
				{ id: 2, visible: false },
			])
		);
		expect(state.selected).toEqual([
			{ id: 1, visible: true },
			{ id: 2, visible: false },
		]);
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
	describe('setLineVisible', () => {
		it('toggles visibility when visible not specified', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: true }] }));

			setLineVisible(1)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [{ id: 1, visible: false }],
				})
			);
		});

		it('sets explicit visibility', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: true }] }));

			setLineVisible(1, false)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [{ id: 1, visible: false }],
				})
			);
		});

		it('does nothing if id not found', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 2, visible: true }] }));

			setLineVisible(1)(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe('setLineSelected', () => {
		it('adds line to selected when not present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [] }));

			setLineSelected(1)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [{ id: 1, visible: true }],
				})
			);
		});

		it('removes line from selected when present', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: true }] }));

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
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: true }] }));

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
		it('always sets visible=true for selected lines (overrides previous visibility)', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: false }] }));

			setLinesSelected([1, 2])(dispatch, getState, undefined as any);

			// visible: true always takes precedence over spread from existing item
			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'lines/setSelected',
					payload: [
						{ id: 1, visible: true },
						{ id: 2, visible: true },
					],
				})
			);
		});

		it('no-op when selected matches exactly', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ selected: [{ id: 1, visible: true }] }));

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

	it('selectSelected runs uniq (dedup by reference, not by content)', () => {
		// lodash uniq uses SameValueZero — it removes duplicate references,
		// not objects with equal properties.
		const sameRef = { id: 1, visible: true };
		const stateRef = buildRoot({
			selected: [sameRef, sameRef],
		});
		const resultRef = selectSelected(stateRef);
		expect(resultRef).toHaveLength(1);
		expect(resultRef[0]).toBe(sameRef);

		// Different objects with same properties are NOT deduped.
		const stateVal = buildRoot({
			selected: [
				{ id: 1, visible: true },
				{ id: 1, visible: true },
			],
		});
		const resultVal = selectSelected(stateVal);
		expect(resultVal).toHaveLength(2); // two distinct objects
	});

	it('selectSelectedInfos computes selectedIds and visibleMap', () => {
		const state = buildRoot({
			selected: [
				{ id: 1, visible: true },
				{ id: 2, visible: false },
			],
		});
		const infos = selectSelectedInfos(state);
		expect(infos.selectedIds).toEqual([1, 2]);
		expect(infos.visibleMap).toEqual({ 1: true, 2: false });
	});
});
