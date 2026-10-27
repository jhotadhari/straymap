/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

// The measure feature has no persisted settings — always initialized.
export const selectInitialized = (_state: RootState) => true;

export const selectMeasurePosition = (state: RootState) => state.measure.position;

export const selectMeasureActive = (state: RootState) => state.measure.position !== null;
