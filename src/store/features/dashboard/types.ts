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

	showLabel?: boolean;
	showIcon?: boolean;
};

export type DashboardWidgetProps<Options = {}> = {
	item: DashboardItem<Options>;
	style?: ViewStyle;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
};

export type DashboardWidget<Options = {}> = {
	key: string;
	label: string;
	Display: ElementType<DashboardWidgetProps<Options>>;
	Control?: ElementType<DashboardWidgetProps<Options>>;
	Icon?: ElementType<{
		color: string;
		size: number;
	}>;
	shouldSetHgtDirPath?: boolean;
	defaultMinWidth: number;
	responseInclude?: ResponseInclude;
};

export interface DashboardWidgetSetting extends Omit<
	DashboardWidget,
	'Display' | 'Control' | 'Icon'
> {}
