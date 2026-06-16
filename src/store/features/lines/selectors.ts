/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectSelected = (state: RootState) => state.lines.selected;

export const selectLineTemp = (state: RootState) => state.lines.lineTemp;

export const selectSelectedInfos = createAppSelector(
	(state: RootState) => state.lines.selected,
	(selected) => ({
		selectedIds: selected.map((a) => a.id),
		visibleMap: selected.reduce<{ [id: string]: boolean }>((acc, a) => {
			acc[a.id] = a.visible;
			return acc;
		}, {}),
	})
);
