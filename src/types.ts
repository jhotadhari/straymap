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
import { SettingsPageDescriber, UiItem } from './features/ui/types';
import { DashboardWidget } from './features/dashboard/types';
import { DrawerPanel } from './features/drawers/types';

export type { UiItem, DashboardWidget, DrawerPanel };

export type AppMode = string;

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

/** A component rendered inside the MapContainer. */
export interface MapComponentDescriptor {
	key: string;
	Component: ElementType<any>;
	priority: number;
	props?: Record<string, unknown>;
}

/** A component rendered as a sibling overlay above the map. */
export interface AppOverlayDescriptor {
	key: string;
	Component: ElementType<any>;
	priority: number;
	props?: Record<string, unknown>;
}

export interface AppFeature {
	/**
	 * Selector that returns whether this feature's persisted settings have
	 * been restored from storage. Used by `useSettingsInitialized` to block
	 * the app UI until all features report `true`.
	 */
	selectInitialized: (state: any) => boolean;

	/**
	 * Translations keyed by language code (e.g. `{ en: {...}, de: {...} }`).
	 * Merged into i18next resources at app init. Each feature places its
	 * translation JSON files under `assets/i18n/`.
	 */
	translation: { [lang: string]: any };

	/**
	 * Optional: restore persisted settings from storage on boot.
	 * Receives the Redux store; should dispatch slice actions to restore
	 * state. Returns `void` or `Promise<boolean>`.
	 */
	initializeFromStorage?: (store: EnhancedStore) => void | Promise<boolean>;

	/**
	 * Optional: called when the database path changes (e.g. user switches
	 * to a different DB file). Should return a thunk that re-initializes
	 * any DB-dependent state.
	 */
	onSetDbPath?: () => AppThunk;

	/**
	 * Extension points — each feature can optionally contribute to these.
	 * All are collected by `FeatureRegistry.registerAll()` and exposed via
	 * the corresponding `get*()` methods, sorted by `priority` (default 100).
	 */

	/**
	 * All UiItems this feature contributes, used for the navigation stack
	 * (settings drill-down, drawers, modals, etc.). Each feature's UiItem
	 * components live under its `uiItems/` directory.
	 *
	 * Not every UiItem appears in the Settings list — only those whose key
	 * matches a {@link settingsPages} entry are rendered as a row in the
	 * the main Settings screen. Items without a matching entry can still be
	 * pushed onto the navigation stack from other entry points (e.g. the
	 * drawer handle, the dashboard editor, or the top app bar).
	 */
	uiItems?: UiItem[];

	/**
	 * Descriptors that promote a {@link uiItems} entry to a row in the
	 * main Settings navigation list. Each entry references its UiItem
	 * via {@link SettingsPageDescriber.uiItemKey} and carries its own
	 * priority for ordering. The Settings screen inserts a divider
	 * between entries whose priorities fall into different 1000-blocks.
	 */
	settingsPages?: SettingsPageDescriber[];

	/**
	 * Individual control rows rendered inside the settings controls page
	 * (`SettingsControls.tsx`). Use this for feature-level toggles or
	 * configuration that doesn't warrant a dedicated settings page.
	 */
	settingsControls?: SettingsControlFragment[];

	/**
	 * Dashboard widgets that can be placed on the map overlay via the
	 * dashboard editor. Each feature's widget definitions live under its
	 * `dashboardWidgets/` directory.
	 */
	dashboardWidgets?: DashboardWidget<any>[];

	/**
	 * Drawer panels — sidebar / pull-out panels accessible from the map.
	 * Each feature defines its panels under its own `drawerPanels/`
	 * directory (e.g. `gnss/drawerPanels/gnssDrawerItem.tsx`) and registers
	 * them here. The `DrawerPanel` type is defined by the `drawers` feature.
	 */
	drawerPanels?: DrawerPanel[];

	/**
	 * Components rendered inside the MapContainer (map layers, routes,
	 * recording lines, etc.). Each feature's map components live under
	 * its `appOverlays/` directory.
	 */
	mapComponents?: MapComponentDescriptor[];

	/**
	 * Components rendered as sibling overlays above the map (drawers,
	 * dashboard, center indicator, attribution, etc.).
	 */
	appOverlays?: AppOverlayDescriptor[];

	/**
	 * Modes this feature can activate (e.g. `'location'`, `'trackRecording'`,
	 * `'routing'`). Modes are string identifiers aggregated across all
	 * features by `FeatureRegistry.getActiveModes()`.
	 */
	modes?: AppMode[];

	/**
	 * Selector that returns the subset of `modes` that are currently active.
	 * For example, the gnss feature returns `['location']` when GNSS is on,
	 * and `[]` when off. Used to drive mode-dependent UI and behavior.
	 */
	selectActiveModes?: (state: any) => AppMode[];

	/**
	 * Labels of tags that are managed by this feature and should not be
	 * deletable or detachable by the user. Aggregated across all features
	 * by `FeatureRegistry.getSystemTagLabels()`.
	 */
	systemTagLabels?: readonly string[];
}
