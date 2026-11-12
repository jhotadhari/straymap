/**
 * Tests for the drawers slice — moving/assigning item keys between sides,
 * including keys that are registered but present in no side list yet
 * (newly added drawer panels).
 */

/**
 * Internal dependencies
 */
import drawersReducer, { moveItemKey, setActiveKey, toggleItemKeySide } from '../slice';

describe('drawers slice', () => {
	it('moves an unassigned key onto a side (newly registered panel)', () => {
		let state = drawersReducer(undefined, { type: 'init' });
		// 'lineFollow' is in no list — like a brand-new registered panel.
		state = drawersReducer(
			state,
			moveItemKey({ itemKey: 'lineFollow', side: 'left', index: Infinity })
		);
		expect(state.itemKeysLeft).toContain('lineFollow');
		expect(state.itemKeysRight).not.toContain('lineFollow');
		expect(state.itemKeysAvailable).not.toContain('lineFollow');
	});

	it('activates a panel right after it was moved onto a side', () => {
		let state = drawersReducer(undefined, { type: 'init' });
		state = drawersReducer(
			state,
			moveItemKey({ itemKey: 'lineFollow', side: 'right', index: Infinity })
		);
		state = drawersReducer(state, setActiveKey({ activeKey: 'lineFollow' }));
		expect(state.activeKeyRight).toBe('lineFollow');
	});

	it('toggleItemKeySide adds an unassigned key onto the side', () => {
		let state = drawersReducer(undefined, { type: 'init' });
		state = drawersReducer(state, toggleItemKeySide({ itemKey: 'lineFollow', side: 'left' }));
		expect(state.itemKeysLeft).toContain('lineFollow');
	});

	it('moving a key between sides removes it from the previous side', () => {
		let state = drawersReducer(undefined, { type: 'init' });
		state = drawersReducer(
			state,
			moveItemKey({ itemKey: 'routing', side: 'left', index: Infinity })
		);
		expect(state.itemKeysRight).not.toContain('routing');
		expect(state.itemKeysLeft).toContain('routing');
	});

	it("clears the previous side's active key when its active item moves away", () => {
		let state = drawersReducer(undefined, { type: 'init' });
		// 'maps' is the initial active right item.
		state = drawersReducer(
			state,
			moveItemKey({ itemKey: 'maps', side: 'left', index: Infinity })
		);
		expect(state.activeKeyRight).toBeUndefined();
		expect(state.itemKeysRight).not.toContain('maps');
		expect(state.itemKeysLeft).toContain('maps');
	});
});
