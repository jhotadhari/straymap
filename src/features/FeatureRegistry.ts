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
	MapCornerComponentDescriptor,
	SettingsControlFragment,
	UiItem,
} from '../types';
import { SettingsPage } from './ui/types';

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

	/** Returns all uiItems from all features. */
	getUiItems(): UiItem[] {
		const items: UiItem[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.uiItems) {
				items.push(...feature.uiItems);
			}
		}
		return items;
	}

	/**
	 * Returns all settings pages from all features, sorted by priority.
	 * Each entry is a {@link SettingsPage} combining the feature's
	 * {@link SettingsPageDescriber} with its matching {@link UiItem}
	 * (resolved via uiItemKey). Rendered by the main Settings screen
	 * with dividers between 1000-priority blocks.
	 */
	getSettingsPages(): SettingsPage[] {
		const items: SettingsPage[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.uiItems && feature?.settingsPages) {
				feature?.settingsPages?.forEach((settingsPage) => {
					const uiItem = feature.uiItems?.find((i) => i.key === settingsPage.key);
					if (uiItem) {
						items.push({
							...settingsPage,
							uiItem,
						} as SettingsPage);
					}
				});
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

	/** Returns map corner components, sorted by priority. */
	getMapCornerComponents(): MapCornerComponentDescriptor[] {
		const components: MapCornerComponentDescriptor[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.mapCornerComponents) {
				components.push(...feature.mapCornerComponents);
			}
		}
		components.sort((a, b) => a.priority - b.priority);
		return components;
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

	/** Returns all system-protected tag labels from all features, de-duplicated. */
	getSystemTagLabels(): string[] {
		const labels: string[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.systemTagLabels) {
				labels.push(...feature.systemTagLabels);
			}
		}
		return [...new Set(labels)];
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

	/**
	 * Returns all feature-owned line IDs aggregated into a single record.
	 * Keys are feature-specific names (e.g. 'routing', 'trackRecording'),
	 * values are the line IDs. Aggregated across all features that implement
	 * `selectSystemLineIds`.
	 */
	getSystemLineIds(state: any): Record<string, number> {
		const ids: Record<string, number> = {};
		for (const feature of Object.values(this.features())) {
			if (feature.selectSystemLineIds) {
				const featureIds = feature.selectSystemLineIds(state);
				for (const [key, lineId] of Object.entries(featureIds)) {
					if (lineId != null) {
						ids[key] = lineId;
					}
				}
			}
		}
		return ids;
	}
}

export const featureRegistry = new FeatureRegistry();
