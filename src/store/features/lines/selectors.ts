/**
 * External dependencies
 */
import { uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectLineTemp = (state: RootState) => state.lines.lineTemp;

export const selectSelected = createAppSelector(
	(state: RootState) => state.lines.selected,
	(selected) => uniq(selected)
);

export const selectSelectedInfos = createAppSelector(
	(state: RootState) => selectSelected(state),
	(selected) => ({
		selectedIds: selected.map((a) => a.id),
		visibleMap: selected.reduce<{ [id: string]: boolean }>((acc, a) => {
			acc[a.id] = a.visible;
			return acc;
		}, {}),
	})
);
