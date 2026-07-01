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
	lineIds: number[];
	linesCount: number;
	routingLineId?: number | null;
	routeId?: number | null;
	setOnMapIdsTemp?: Dispatch<SetStateAction<number[]>>;
	setCheckedIds?: Dispatch<SetStateAction<number[]>>;
};

export const FooterContext = createContext<FooterContextType>({
	checkedIds: [],
	lineIds: [],
	linesCount: 0,
});
