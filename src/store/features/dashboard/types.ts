/**
 * External dependencies
 */
import { GestureResponderEvent, ViewStyle } from 'react-native';
import { ElementType } from 'react';
import { ResponseInclude } from 'react-native-mapsforge-vtm';

export type DashboardStyle = {
	align: string;
	fontSize: number;
};

export type DashboardItem<Options = {}> = {
	key: string;
	elementType: string;
	options?: Options;
	style?: ViewStyle;


	fontSize?: number;
	minWidth?: number;
};

export type DashboardElementProps<Options = {}> = {
	item: DashboardItem<Options>;
	style?: ViewStyle;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
};

export type DashboardElement<Options = {}> = {
	key: string;
	label: string;
	Display: ElementType<DashboardElementProps<Options>>;
	Control?: ElementType<DashboardElementProps<Options>>;
	Icon?: ElementType<{
		color: string;
		size: number;
	}>;
	shouldSetHgtDirPath?: boolean;
	defaultMinWidth: number;
	responseInclude?: ResponseInclude;
};

export interface DashboardElementSetting extends Omit<DashboardElement, 'Display' | 'Control' | 'Icon'> {};
