/**
 * External dependencies
 */
import { createContext } from 'react';

export type BottomDrawerContextType = {
	activeItemKey?: string;
	width: number;
	height: number;
	getIsFullyCollapsed: () => boolean;
	setActiveItemKey: (newActiveKey?: string) => void;
	expand: (expanded: number | boolean) => void;
};

const BottomDrawerContext = createContext<BottomDrawerContextType>({
	activeItemKey: undefined,
	width: 0,
	height: 0,
	getIsFullyCollapsed: () => true,
	setActiveItemKey: (_newActiveKey?: string) => {},
	expand: (_expanded: number | boolean) => {},
});

export default BottomDrawerContext;
