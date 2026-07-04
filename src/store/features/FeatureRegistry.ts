/**
 * Internal dependencies
 */
import {
	AppFeature,
	AppMode,
	AppOverlayDescriptor,
	DashboardWidget,
	DrawerPanel,
	MapComponentDescriptor,
	SettingsControlFragment,
	SettingsPage,
} from '../../types';

const DEFAULT_PRIORITY = 100;

/**
 * Singleton registry that collects extension points from all features.
 *
 * Populated once at module-init time via {@link registerAll}, then read
 * by consumers at render time (inside useMemo) or during initialization.
 */
export class FeatureRegistry {
	private _features: Record<string, AppFeature> | null = null;

	/**
	 * Called once during initialization with the full features map.
	 */
	registerAll(features: Record<string, AppFeature>): void {
		this._features = features;
	}

	private features(): Record<string, AppFeature> {
		if (!this._features) {
			return {};
		}
		return this._features;
	}

	/** Returns all settings pages from all features, sorted by priority. */
	getSettingsPages(): SettingsPage[] {
		const items: SettingsPage[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.settingsPages) {
				items.push(...feature.settingsPages);
			}
		}
		items.sort((a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY));
		return items;
	}

	/** Returns all settings control fragments, sorted by priority. */
	getSettingsControls(): SettingsControlFragment[] {
		const controls: SettingsControlFragment[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.settingsControls) {
				controls.push(...feature.settingsControls);
			}
		}
		controls.sort(
			(a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY)
		);
		return controls;
	}

	/**
	 * Returns all dashboard widgets as a keyed record (widgetKey → definition).
	 * Later features overwrite earlier ones when keys collide.
	 */
	getDashboardWidgets(): Record<string, DashboardWidget> {
		const widgets: Record<string, DashboardWidget> = {};
		for (const [, feature] of Object.entries(this.features())) {
			if (feature.dashboardWidgets) {
				for (const widget of feature.dashboardWidgets) {
					widgets[widget.key] = widget;
				}
			}
		}
		return widgets;
	}

	/** Returns all drawer panels as a keyed record (panelKey → definition). */
	getDrawerPanels(): Record<string, DrawerPanel> {
		const panels: Record<string, DrawerPanel> = {};
		for (const [, feature] of Object.entries(this.features())) {
			if (feature.drawerPanels) {
				for (const panel of feature.drawerPanels) {
					const key = panel.key ?? '';
					if (key) {
						panels[key] = panel;
					}
				}
			}
		}
		return panels;
	}

	/** Returns map components (rendered inside MapContainer), sorted by priority. */
	getMapComponents(): MapComponentDescriptor[] {
		const components: MapComponentDescriptor[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.mapComponents) {
				components.push(...feature.mapComponents);
			}
		}
		components.sort((a, b) => a.priority - b.priority);
		return components;
	}

	/** Returns app overlays (rendered above the map), sorted by priority. */
	getAppOverlays(): AppOverlayDescriptor[] {
		const overlays: AppOverlayDescriptor[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.appOverlays) {
				overlays.push(...feature.appOverlays);
			}
		}
		overlays.sort((a, b) => a.priority - b.priority);
		return overlays;
	}

	/** Returns all modes declared by all features, de-duplicated. */
	getAllModes(): AppMode[] {
		const modes: AppMode[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.modes) {
				modes.push(...feature.modes);
			}
		}
		return [...new Set(modes)];
	}

	/** Returns the set of currently active modes from all features. */
	getActiveModes(state: any): AppMode[] {
		const active: AppMode[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.selectActiveModes) {
				const featureModes = feature.selectActiveModes(state);
				if (featureModes?.length) {
					active.push(...featureModes);
				}
			}
		}
		return [...new Set(active)];
	}
}

export const featureRegistry = new FeatureRegistry();
