/**
 * External dependencies
 */
import { GestureResponderEvent, ViewStyle } from 'react-native';
import { ElementType } from 'react';

export type DashboardStyle = {
	align: string;
	fontSize: number;
	showLabel: boolean;
	showIcon: boolean;
};

/**
 * Open category namespace — categories are not registered anywhere. A
 * widget carrying a category makes it exist; consumers group/order the
 * known ones and fall back to the raw key for unknown ones.
 */
export type DashboardCategory = string;

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
	category: DashboardCategory;
	label: string;
	desc?: string;
	Display: ElementType<DashboardWidgetProps<Options>>;
	Control?: ElementType<DashboardWidgetProps<Options>>;
	Icon?: ElementType<{
		color: string;
		size: number;
		rotation?: number;
	}>;
	shouldSetHgtDirPath?: boolean;
	defaultMinWidth: number;
};

export interface DashboardWidgetSetting extends Omit<
	DashboardWidget,
	'Display' | 'Control' | 'Icon'
> {}
