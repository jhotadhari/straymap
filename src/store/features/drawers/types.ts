/**
 * External dependencies
 */
import { ElementType, ReactElement, ReactNode } from 'react';
import { TextStyle } from 'react-native';
import { ComposedGesture, GestureType } from 'react-native-gesture-handler';

export type DrawerState = {
	showContent: boolean;
	gesture: ComposedGesture | GestureType;
	animatedStyles: any;
	side: string;
	drawerWidth: number;
	outerWidth: number;
	expand: (expanded: boolean) => void;
	getIsFullyCollapsed: () => boolean;
};

export interface DrawerItem {
	key: string | null;	// The control handle has key null.
	label?: string;
	iconSource?: string;
	DisplayComponent?: ElementType<{}>;
	IconComponent?: ElementType<{
		color: TextStyle['color'];
	}>;
	IconActions?: ElementType<{
		style?: TextStyle;
	}>;
}