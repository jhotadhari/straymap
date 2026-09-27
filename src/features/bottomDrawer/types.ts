/**
 * External dependencies
 */
import { ElementType } from 'react';
import { TextStyle } from 'react-native';
import { ComposedGesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

export interface BottomDrawerItem {
	key: string;
	label?: string;
	iconSource?: string;
	IconComponent?: ElementType<{
		color?: TextStyle['color'];
		size?: number;
	}>;
	DisplayComponent: ElementType;
}

export type BottomDrawerState = {
	showContent: boolean;
	gesture: ComposedGesture | GestureType;
	animatedStyles: any;
	collapsedHeight: number;
	openHeight: number;
	height: SharedValue<number>;
	expand: (expanded: number | boolean) => void;
	getIsFullyCollapsed: () => boolean;
};

export interface BottomDrawerControls {
	height: SharedValue<number>;
	getIsFullyCollapsed: () => boolean;
	expand: (expanded: number | boolean) => void;
}
