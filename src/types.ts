/**
 * External dependencies
 */
import { EnhancedStore } from '@reduxjs/toolkit';
import { ElementType, ReactNode } from 'react';
import { Position } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { AppThunk } from './store/store';
import { UiItem } from './store/features/ui/types';
import { DashboardElement } from './store/features/dashboard/types';
import { DrawerItem } from './store/features/drawers/types';

export type { UiItem, DashboardElement, DrawerItem };

// source: https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type#answer-51399781
export type ArrayElement<ArrayType extends readonly unknown[]> =
	ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export interface SliceSettingsBase {
	initialized: boolean;
}

export type InitialPosition = {
	center: Position;
	zoomLevel: number;
};

export type BottomBarHeight = { [value: string]: number };

export interface OptionBase {
	key: string;
	label: string;
}

export interface MenuActionOption extends OptionBase {
	leadingIcon: string;
	cb: () => Promise<void> | void;
	disabled?: () => boolean;
	modalNode?: ReactNode;
}

export type NumType = 'int' | 'float';

export interface SettingsControlFragment {
	key: string;
	label: string;
	Control: ElementType;
	priority?: number;
}

export interface MapViewComponentDescriptor {
	key: string;
	Component: ElementType<any>;
	placement: 'inside-map' | 'sibling-overlay';
	priority: number;
	props?: Record<string, unknown>;
}

export interface AppFeature {
	// Used by useSettingsInitialized.
	selectInitialized: (state: any) => boolean;
	// Used by i18n to build resources.
	translation: { [lang: string]: any };
	// If AppFeature does not expose a initializeFromStorage function, it has to be called manually.
	initializeFromStorage?: (store: EnhancedStore) => void | Promise<boolean>;

	onSetDbPath?: () => AppThunk;

	// Extension points — each feature can optionally contribute to these.
	settingsItems?: UiItem[];
	settingsControls?: SettingsControlFragment[];
	dashboardElements?: DashboardElement<any>[];
	drawerItems?: DrawerItem[];
	mapViewComponents?: MapViewComponentDescriptor[];
}
