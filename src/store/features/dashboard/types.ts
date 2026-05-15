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

export interface DashboardItemOptionsBase {
	fontSize?: number;
	minWidth?: number;
}

export type DashboardItem<Options = DashboardItemOptionsBase> = {
	key: string;
	elementType: string;
	style?: ViewStyle;
	options?: Options;
};

export type DashboardElementProps<Options = DashboardItemOptionsBase> = {
	item: DashboardItem<Options>;
	style?: ViewStyle;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
};

export type DashboardElement<Options = DashboardItemOptionsBase> = {
	key: string;
	label: string;
	Display: ElementType<DashboardElementProps<Options>>;
	Control?: ElementType<DashboardElementProps<Options>>;
	Icon?: ElementType<{
		color: string;
		size: number;
	}>;
	hasMinWidthControl?: boolean;
	hasFontSizeControl?: boolean;
	shouldSetHgtDirPath?: boolean;
	defaultMinWidth: number;
	responseInclude?: ResponseInclude;
};
