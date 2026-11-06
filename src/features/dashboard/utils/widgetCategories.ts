/**
 * Internal dependencies
 */
import { DashboardCategory, DashboardWidget } from '../types';

/**
 * Display order of dashboard widget categories in the new-item modal.
 * Categories are open (not registered anywhere) — widgets carrying an
 * unknown category still render, grouped after the known ones in
 * first-seen order.
 */
export const CATEGORY_ORDER: DashboardCategory[] = [
	'map',
	'gnss',
	'sensor',
	'tracking',
	'following',
	'misc',
];

/** i18n key of a category's display name (dashboard feature namespace). */
export const getCategoryLabelKey = (category: DashboardCategory): string =>
	`dashboard.categories.${category}`;

export interface WidgetCategoryGroup {
	category: DashboardCategory;
	widgets: DashboardWidget[];
}

/**
 * Group dashboard widgets by their category.
 *
 * Groups follow {@link CATEGORY_ORDER}; unknown categories are appended
 * in first-seen order. Widgets keep their input order within each group.
 */
export const groupWidgetsByCategory = (widgets: DashboardWidget[]): WidgetCategoryGroup[] => {
	const groups = new Map<DashboardCategory, DashboardWidget[]>();
	for (const widget of widgets) {
		const list = groups.get(widget.category);
		if (list) {
			list.push(widget);
		} else {
			groups.set(widget.category, [widget]);
		}
	}

	const ordered: WidgetCategoryGroup[] = [];
	for (const category of CATEGORY_ORDER) {
		const list = groups.get(category);
		if (list) {
			ordered.push({ category, widgets: list });
			groups.delete(category);
		}
	}
	// Remaining unknown categories, first-seen order.
	for (const [category, list] of groups) {
		ordered.push({ category, widgets: list });
	}
	return ordered;
};
