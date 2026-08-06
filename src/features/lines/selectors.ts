/**
 * Internal dependencies
 */
import createAppSelector from '../../store/createAppSelector';
import { RootState } from '../../store/store';
import { lineCells, statsCells, otherCells } from './components/LinesTable/sharedDeps';
import { tagCells } from './components/TagsTable/sharedDeps';

export const selectInitialized = (state: RootState) => state.lines.initialized;

export const selectTagBadgeMode = (state: RootState) => state.lines.tagBadgeMode;

export const selectUseSimplification = (state: RootState) => state.lines.useSimplification;

export const selectLineTemp = (state: RootState) => state.lines.lineTemp;

export const selectTagTemp = (state: RootState) => state.lines.tagTemp;

export const selectSelected = (state: RootState) => state.lines.selected;

const allLinesColumnKeys = [
	...Object.keys(lineCells),
	...Object.keys(statsCells),
	...Object.keys(otherCells),
];
const hiddenByDefaultColumnKeys = new Set(['id', 'created_at', 'modified_at']);

export const selectLinesTableColumns = createAppSelector(
	(state: RootState) => state.lines.linesTable.tableColumns,
	(tableColumns) => {
		// in case new columns got implemented, add them (visible) to tableColumns from store.
		let result = [...tableColumns];
		allLinesColumnKeys.forEach((key) => {
			if (!result.some((col) => col.key === key)) {
				result.push({
					key,
					visible: !hiddenByDefaultColumnKeys.has(key),
				});
			}
		});
		// in case implemented columns got removed, filter them out.
		return result.filter((col) => allLinesColumnKeys.includes(col.key));
	}
);

// ── Sort / Filter ───────────────────────────────────────────────────

export const selectLinesSort = (state: RootState) => state.lines.linesTable.sort;

export const selectLinesFilters = (state: RootState) => state.lines.linesTable.filters;

export const selectLinesFilterLogic = (state: RootState) => state.lines.linesTable.filterLogic;

export const selectLinesFilterableColumns = (state: RootState) => selectLinesTableColumns(state);

// ── TagsTable selectors ──────────────────────────────────────────────

const allTagColumnKeys = Object.keys(tagCells);

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
