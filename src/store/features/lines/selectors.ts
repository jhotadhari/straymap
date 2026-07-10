/**
 * External dependencies
 */
import { uniq } from 'lodash-es';

/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';
import { lineCells, statsCells, otherCells } from './components/LinesTable/sharedDeps';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectLineTemp = (state: RootState) => state.lines.lineTemp;

export const selectTagTemp = (state: RootState) => state.lines.tagTemp;

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

const allColumnKeys = [
	...Object.keys(lineCells),
	...Object.keys(statsCells),
	...Object.keys(otherCells),
];
export const selectTableColumns = createAppSelector(
	(state: RootState) => state.lines.linesTable.tableColumns,
	(tableColumns) => {
		// in case new columns got implemented, add them (visible) to tableColumns from store.
		let result = [...tableColumns];
		allColumnKeys.forEach((key) => {
			if (!result.some((col) => col.key === key)) {
				result.push({
					key,
					visible: true,
				});
			}
		});
		// in case implemented columns got removed, filter them out.
		return result.filter((col) => allColumnKeys.includes(col.key));
	}
);

// ── Sort / Filter ───────────────────────────────────────────────────

export const selectSort = (state: RootState) => state.lines.linesTable.sort;

export const selectFilters = (state: RootState) => state.lines.linesTable.filters;

export const selectFilterLogic = (state: RootState) => state.lines.linesTable.filterLogic;

export const selectFilterableColumns = (state: RootState) => selectTableColumns(state);

// ── TagsTable selectors ──────────────────────────────────────────────

const allTagColumnKeys = Object.keys({
	label: {},
	line_count: {},
	created_at: {},
	color: {},
	notes: {},
});

export const selectTagsTableColumns = createAppSelector(
	(state: RootState) => state.lines.tagsTable.tableColumns,
	(tableColumns) => {
		let result = [...tableColumns];
		allTagColumnKeys.forEach((key) => {
			if (!result.some((col) => col.key === key)) {
				result.push({
					key,
					visible: true,
				});
			}
		});
		return result.filter((col) => allTagColumnKeys.includes(col.key));
	}
);

export const selectTagsSort = (state: RootState) => state.lines.tagsTable.sort;

export const selectTagsFilters = (state: RootState) => state.lines.tagsTable.filters;

export const selectTagsFilterLogic = (state: RootState) => state.lines.tagsTable.filterLogic;

export const selectTagsFilterableColumns = (state: RootState) => selectTagsTableColumns(state);
