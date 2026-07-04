/**
 * Internal dependencies
 */
import {
	AppFeature,
	DashboardElement,
	DrawerItem,
	MapViewComponentDescriptor,
	SettingsControlFragment,
	UiItem,
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

	/** Returns all settings items from all features, sorted by priority. */
	getSettingsItems(): UiItem[] {
		const items: UiItem[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.settingsItems) {
				items.push(...feature.settingsItems);
			}
		}
		items.sort(
			(a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY)
		);
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
	 * Returns all dashboard elements as a keyed record (elementKey → definition).
	 * Later features overwrite earlier ones when keys collide.
	 */
	getDashboardElements(): Record<string, DashboardElement> {
		const elements: Record<string, DashboardElement> = {};
		for (const [, feature] of Object.entries(this.features())) {
			if (feature.dashboardElements) {
				for (const element of feature.dashboardElements) {
					elements[element.key] = element;
				}
			}
		}
		return elements;
	}

	/** Returns all drawer items as a keyed record (itemKey → definition). */
	getDrawerItems(): Record<string, DrawerItem> {
		const items: Record<string, DrawerItem> = {};
		for (const [, feature] of Object.entries(this.features())) {
			if (feature.drawerItems) {
				for (const item of feature.drawerItems) {
					const key = item.key ?? '';
					if (key) {
						items[key] = item;
					}
				}
			}
		}
		return items;
	}

	/** Returns map view components for the given placement, sorted by priority. */
	getMapViewComponents(
		placement: MapViewComponentDescriptor['placement']
	): MapViewComponentDescriptor[] {
		const components: MapViewComponentDescriptor[] = [];
		for (const feature of Object.values(this.features())) {
			if (feature.mapViewComponents) {
				for (const desc of feature.mapViewComponents) {
					if (desc.placement === placement) {
						components.push(desc);
					}
				}
			}
		}
		components.sort((a, b) => a.priority - b.priority);
		return components;
	}
}

export const featureRegistry = new FeatureRegistry();
