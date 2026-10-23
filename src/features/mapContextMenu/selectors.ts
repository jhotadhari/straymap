/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

// The mapContextMenu feature has no persisted state — it is always
// initialized. Kept as a selector to satisfy the AppFeature contract.
export const selectInitialized = (_state: RootState) => true;
