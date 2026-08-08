/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * Internal dependencies
 */

export type DrawerContextType = {
	side: string;
	activeItemKey?: string;
	width: number;
	height: number;
	getIsFullyCollapsed: () => boolean;
	setActiveItemKey: (newActiveKey?: string) => void;
	expand: (expanded: number | boolean) => void;
};

const DrawerContext = createContext<DrawerContextType>({
	side: '',
	activeItemKey: undefined,
	width: 0,
	height: 0,
	getIsFullyCollapsed: () => true,
	setActiveItemKey: (_newActiveKey?: string) => {},
	expand: (_expanded: number | boolean) => {},
});

export default DrawerContext;
