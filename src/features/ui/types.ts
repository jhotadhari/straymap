/**
 * External dependencies
 */
import { ElementType, ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

export interface UiItem {
	key: string;
	icon?: string | ((props: { color: string; style: ListStyle }) => ReactNode);
	label: string;
	Component?: ElementType<{ style?: ViewStyle }>;
}

export interface SettingsPageDescriber {
	// Any uniq string.
	key: string;

	// Key to match a UiItem.
	uiItemKey: string;

	// Settings component renders SettingsPages in priority order with a Divider every 1000 priority.
	priority?: number;
}

export interface SettingsPage extends SettingsPageDescriber {
	uiItem: UiItem;
}
