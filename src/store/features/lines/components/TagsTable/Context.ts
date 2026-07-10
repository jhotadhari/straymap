/**
 * External dependencies
 */
import { createContext, Dispatch, SetStateAction } from 'react';

export type HeaderContextType = {
	checkedIds: number[];
};

export const HeaderContext = createContext<HeaderContextType>({
	checkedIds: [],
});

export type FooterContextType = {
	checkedIds: number[];
	tagIds: number[];
	tagsCount: number;
	tags?: { id: number; label: string | null }[];
	setCheckedIds?: Dispatch<SetStateAction<number[]>>;
};

export const FooterContext = createContext<FooterContextType>({
	checkedIds: [],
	tagIds: [],
	tagsCount: 0,
});

export type ColumnHeaderMenuContextType = {
	openFilterForColumn: (columnKey: string) => void;
};

export const ColumnHeaderMenuContext = createContext<ColumnHeaderMenuContextType>({
	openFilterForColumn: () => {},
});
