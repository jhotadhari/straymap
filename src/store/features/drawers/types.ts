/**
 * External dependencies
 */
import { Dispatch, ElementType, SetStateAction } from 'react';
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
	key?: string;
	label?: string;
	iconSource?: string;
	DisplayComponent?: ElementType<{
		scrollEnabled: boolean;
		setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	}>;
	IconComponent?: ElementType<{
		color: TextStyle['color'];
	}>;
	IconActions?: ElementType<{
		style?: TextStyle;
	}>;
}

export interface DrawerProps extends DrawerState {
	height: number;
	setModalVisible: Dispatch<SetStateAction<boolean>>;
}

export interface DrawerControl {
	getIsFullyCollapsed: DrawerState['getIsFullyCollapsed'];
	expand: DrawerState['expand'];

};

export interface DrawerControls {
    left: DrawerControl;
    right: DrawerControl;
};
