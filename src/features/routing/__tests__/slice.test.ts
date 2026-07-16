/**
 * Tests for routing slice reducers and selectors.
 */

/**
 * Internal dependencies
 */
import routingReducer, {
	setInitialized,
	setIsRoutingAction,
	setRoutingLineId,
	setSegment,
	deleteSegments,
	setIsRouting,
	deleteSegmentByKeyVal,
	onSetDbPath,
	initialSettings,
} from '../slice';
import type { RoutingState } from '../slice';
import type { RoutingSegment } from '../types';
import {
	selectInitialized,
	selectIsRouting,
	selectRoutingLineId,
	selectSegments,
} from '../selectors';
import type { RootState } from '../../../store/store';

const buildRoot = (overrides: Partial<RoutingState> = {}) =>
	({
		routing: {
			initialized: false,
			brouterAvailable: null,
			segments: {},
			...initialSettings,
			...overrides,
		},
	}) as RootState;

const makeSegment = (overrides: Partial<RoutingSegment> = {}): RoutingSegment => ({
	fromId: 0,
	toId: 1,
	...overrides,
});

// ===========================================================================
// Reducers
// ===========================================================================

describe('routing slice reducers', () => {
	it('setInitialized', () => {
		const state = routingReducer(undefined, setInitialized(true));
		expect(state.initialized).toBe(true);
	});

	it('setIsRoutingAction clears segments and sets isRouting', () => {
		const prev: RoutingState = {
			initialized: true,
			brouterAvailable: null,
			segments: { '1_2': makeSegment({ fromId: 1, toId: 2 }) },
			routingLineId: 5,
			isRouting: false,
		};
		const state = routingReducer(prev, setIsRoutingAction(42));
		expect(state.isRouting).toBe(42);
		expect(state.segments).toEqual({});
		expect(state.routingLineId).toBeNull();
	});

	it('setIsRoutingAction sets isRouting to false', () => {
		const prev: RoutingState = {
			initialized: true,
			brouterAvailable: null,
			segments: { '1_2': makeSegment() },
			routingLineId: 5,
			isRouting: 42,
		};
		const state = routingReducer(prev, setIsRoutingAction(false));
		expect(state.isRouting).toBe(false);
		expect(state.segments).toEqual({});
	});

	it('setRoutingLineId updates routing line id', () => {
		const state = routingReducer(undefined, setRoutingLineId(10));
		expect(state.routingLineId).toBe(10);

		const state2 = routingReducer(state, setRoutingLineId(null));
		expect(state2.routingLineId).toBeNull();
	});

	it('setSegment adds a segment keyed by fromId_toId', () => {
		const seg = makeSegment({ fromId: 1, toId: 2, positions: [[0, 0]] });
		const state = routingReducer(undefined, setSegment(seg));
		expect(state.segments['1_2']).toEqual(seg);
	});

	it('setSegment overwrites existing segment', () => {
		const seg1 = makeSegment({ fromId: 1, toId: 2, positions: [[0, 0]] });
		const seg2 = makeSegment({
			fromId: 1,
			toId: 2,
			positions: [[1, 1]],
			isFetching: true,
		});

		let state = routingReducer(undefined, setSegment(seg1));
		state = routingReducer(state, setSegment(seg2));

		expect(state.segments['1_2']).toEqual(seg2);
	});

	it('deleteSegments removes segments by id string', () => {
		const prev: RoutingState = {
			initialized: true,
			brouterAvailable: null,
			segments: {
				'1_2': makeSegment({ fromId: 1, toId: 2 }),
				'2_3': makeSegment({ fromId: 2, toId: 3 }),
			},
			routingLineId: null,
			isRouting: false,
		};
		const state = routingReducer(prev, deleteSegments(['1_2']));
		expect(state.segments).not.toHaveProperty('1_2');
		expect(state.segments).toHaveProperty('2_3');
	});

	it('deleteSegments removes segments by segment object', () => {
		const seg = makeSegment({ fromId: 1, toId: 2 });
		const prev: RoutingState = {
			initialized: true,
			brouterAvailable: null,
			segments: { '1_2': seg },
			routingLineId: null,
			isRouting: false,
		};
		const state = routingReducer(prev, deleteSegments([seg]));
		expect(state.segments).toEqual({});
	});

	it('deleteSegments handles non-existent keys silently', () => {
		const prev: RoutingState = {
			initialized: true,
			brouterAvailable: null,
			segments: { '1_2': makeSegment() },
			routingLineId: null,
			isRouting: false,
		};
		const state = routingReducer(prev, deleteSegments(['nonexistent', '1_2']));
		expect(state.segments).toEqual({});
	});

	it('initial state has no segments', () => {
		const state = routingReducer(undefined, { type: '@@INIT' });
		expect(state.segments).toEqual({});
		expect(state.isRouting).toBe(false);
		expect(state.routingLineId).toBeNull();
	});
});

// ===========================================================================
// Thunks
// ===========================================================================

describe('routing thunks', () => {
	describe('setIsRouting', () => {
		it('dispatches when value changes', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ isRouting: false }));

			setIsRouting(42)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'routing/setIsRouting',
					payload: 42,
				})
			);
		});

		it('does not dispatch when value unchanged', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() => buildRoot({ isRouting: 42 }));

			setIsRouting(42)(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe('deleteSegmentByKeyVal', () => {
		it('deletes segment matching key/value from segments', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() =>
				buildRoot({
					segments: {
						'1_2': makeSegment({ fromId: 1, toId: 2 }),
						'2_3': makeSegment({ fromId: 2, toId: 3 }),
					},
				})
			);

			deleteSegmentByKeyVal('fromId', 1)(dispatch, getState, undefined as any);

			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'routing/deleteSegments',
				})
			);
		});

		it('no-op when no segment matches', () => {
			const dispatch = jest.fn();
			const getState = jest.fn(() =>
				buildRoot({
					segments: {
						'1_2': makeSegment({ fromId: 1, toId: 2 }),
					},
				})
			);

			deleteSegmentByKeyVal('fromId', 99)(dispatch, getState, undefined as any);

			expect(dispatch).not.toHaveBeenCalled();
		});
	});

	describe('onSetDbPath', () => {
		it('dispatches setIsRouting with false', () => {
			const dispatch = jest.fn();
			onSetDbPath()(dispatch, jest.fn(), undefined as any);
			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'routing/setIsRouting',
					payload: false,
				})
			);
		});
	});
});

// ===========================================================================
// Selectors
// ===========================================================================

describe('routing selectors', () => {
	it('selectInitialized', () => {
		expect(selectInitialized(buildRoot({ initialized: true }))).toBe(true);
	});

	it('selectIsRouting', () => {
		expect(selectIsRouting(buildRoot({ isRouting: 99 }))).toBe(99);
		expect(selectIsRouting(buildRoot({ isRouting: false }))).toBe(false);
	});

	it('selectRoutingLineId', () => {
		expect(selectRoutingLineId(buildRoot({ routingLineId: 7 }))).toBe(7);
	});

	it('selectSegments returns segments record', () => {
		const segs = { '1_2': makeSegment() };
		expect(selectSegments(buildRoot({ segments: segs }))).toEqual(segs);
	});
});
