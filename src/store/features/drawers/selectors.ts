/**
 * Internal dependencies
 */
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.drawers.initialized;

export const selectItemKeys = (state: RootState, { side } : { side: string } ) => {
    if ( 'left' === side ) {
        return state.drawers.itemKeysLeft;
    }
    if ( 'right' === side ) {
        return state.drawers.itemKeysRight;
    }
    return [];
};

export const selectActiveKey = (state: RootState, { side } : { side: string } ) => {
    if ( 'left' === side ) {
        return state.drawers.activeKeyLeft;
    }
    if ( 'right' === side ) {
        return state.drawers.activeKeyRight;
    }
    return undefined;
};
