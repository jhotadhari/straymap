/**
 * External dependencies
 */
import { EnhancedStore } from '@reduxjs/toolkit';
import { ElementType, ReactNode } from 'react';
import { TextStyle } from 'react-native';
import { MapTapHit, Position } from 'react-native-mapsforge-vtm';
import type { ColorRamp } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import { AppThunk } from './store/store';
import { SettingsPageDescriber, UiItem } from './features/ui/types';
import { DashboardWidget } from './features/dashboard/types';
import { DrawerPanel } from './features/drawers/types';
import { BottomDrawerItem } from './features/bottomDrawer/types';

export type { UiItem, DashboardWidget, DrawerPanel, BottomDrawerItem };

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

export interface PaletteColor {
	bg: string;
	fg: string;
	border: string;
}

export interface OptionBase {
	key: string;
	label: string;
}

export interface MenuActionOption extends OptionBase {
	leadingIcon?: string;
	IconComponent?: ElementType<{
		color?: TextStyle['color'];
		size?: number;
	}>;
	cb: () => Promise<void> | void;
	disabled?: () => boolean;
	modalNode?: ReactNode;
}

// ── Map context menu (mapContextMenu feature) ────────────────────────────

export type MapContextMenuPress = 'short' | 'long';

/** Everything a context-menu source needs to resolve its actions. */
export interface MapContextMenuContext {
	press: MapContextMenuPress;
	/** Tap position (geo). */
	lng: number;
	lat: number;
	/** Tap position (screen, physical px, map-local — see windowX/windowY). */
	x: number;
	y: number;
	/**
	 * Tap position in WINDOW coordinates (dp) — includes the map view's
	 * offset within the window. The menu popover renders in a Modal
	 * (window space), so it anchors on these, not on x/y.
	 */
	windowX: number;
	windowY: number;
	/** Live map zoom at press time — enables zoom-aware (dp-based) hit resolution. */
	zoomLevel?: number;
	/** Live map tile size at press time. */
	tileSize?: number;
	/** All layer hits under the tap (from the library's HitTestLayer). */
	hits: MapTapHit[];
	/**
	 * Where the menu emission originated. `label` = a measurement-label
	 * press; `map` (default/undefined) = a regular map press, where
	 * sources usually gate on proximity to the viewport center.
	 */
	pressOrigin?: 'label' | 'map';
}

export interface MapContextMenuSourceComponentProps {
	context: MapContextMenuContext;
	/**
	 * Reports this source's menu options for the current context, or null
	 * when the source has nothing to contribute (group omitted). Called
	 * whenever the resolved options change.
	 */
	onOptions: (options: MenuActionOption[] | null) => void;
}

export interface MapContextMenuSource {
	key: string;
	press: MapContextMenuPress;
	/** Group order in the menu (lower first); defaults to 100. */
	priority?: number;
	SourceComponent: ElementType<MapContextMenuSourceComponentProps>;
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

/** A component rendered inside the map corner overlay. */
export interface MapCornerComponentDescriptor {
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
	 * Bottom drawer items — content mountable into the single bottom drawer
	 * (opened with a vertical swipe, handles scroll horizontally). Each
	 * feature defines its items under its own `bottomDrawerItems/` directory
	 * and registers them here. The `BottomDrawerItem` type is defined by the
	 * `bottomDrawer` feature.
	 */
	bottomDrawerItems?: BottomDrawerItem[];

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

	/** Components rendered inside the map corner overlay. */
	mapCornerComponents?: MapCornerComponentDescriptor[];

	/**
	 * Map context-menu sources — each contributes a group of actions to
	 * the tap/long-press context menu (mapContextMenu feature) when the
	 * press type matches and the source resolves non-empty options.
	 * Groups from multiple sources are joined by dividers.
	 */
	mapContextMenuSources?: MapContextMenuSource[];

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
	 * Selector that returns a Record mapping feature-specific keys to
	 * line IDs owned by this feature. Aggregated across all features
	 * by `FeatureRegistry.getSystemLineIds()`. Lines declared here are:
	 * - Protected from bulk-clear operations
	 * - Filtered from default LayerPath rendering (rendered by their own mapComponents)
	 * - Eligible for special UI treatment in line lists (feature-specific icons)
	 *
	 * Example: routing → { routing: 42 }, trackRecording → { trackRecording: 7 }
	 */
	selectSystemLineIds?: (state: any) => Record<string, number | null>;

	/**
	 * Selector that returns a Record mapping line IDs to the colour ramp
	 * that line is rendered with via LayerPathColorRamp. Aggregated
	 * across all features by `FeatureRegistry.getLineColorRamps()`.
	 * Consumers:
	 * - Line-list colour columns render the ramp legend instead of the
	 *   solid palette colour for these lines.
	 * - Non-system lines with a registered ramp are rendered as
	 *   LayerPathColorRamp by LinesMapView (system lines render
	 *   themselves but still register for the legend).
	 *
	 * Example: routing → { 42: SLOPE_COLOR_RAMP }
	 */
	selectLineColorRamps?: (state: any) => Record<number, ColorRamp | null | undefined>;

	/**
	 * Labels of tags that are managed by this feature and should not be
	 * deletable or detachable by the user. Aggregated across all features
	 * by `FeatureRegistry.getSystemTagLabels()`.
	 */
	systemTagLabels?: readonly string[];
}
