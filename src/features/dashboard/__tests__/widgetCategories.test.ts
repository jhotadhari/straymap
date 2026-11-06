/**
 * Tests for dashboard widget category grouping utilities.
 */

import {
	CATEGORY_ORDER,
	getCategoryLabelKey,
	groupWidgetsByCategory,
} from '../utils/widgetCategories';
import type { DashboardWidget } from '../types';

const makeWidget = (key: string, category: string): DashboardWidget => ({
	key,
	category,
	label: `lbl.${key}`,
	Display: () => null,
	defaultMinWidth: 75,
});

describe('groupWidgetsByCategory', () => {
	it('groups widgets under their categories in CATEGORY_ORDER', () => {
		const groups = groupWidgetsByCategory([
			makeWidget('trackingDistance', 'tracking'),
			makeWidget('gnssSpeed', 'gnss'),
			makeWidget('zoomLevel', 'map'),
			makeWidget('spacer', 'misc'),
		]);
		expect(groups.map((group) => group.category)).toEqual([
			'map',
			'gnss',
			'tracking',
			'misc',
		]);
		expect(groups[0].widgets.map((widget) => widget.key)).toEqual(['zoomLevel']);
		expect(groups[3].widgets.map((widget) => widget.key)).toEqual(['spacer']);
	});

	it('keeps widget order within a category', () => {
		const groups = groupWidgetsByCategory([
			makeWidget('a', 'gnss'),
			makeWidget('b', 'gnss'),
			makeWidget('c', 'gnss'),
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0].category).toBe('gnss');
		expect(groups[0].widgets.map((widget) => widget.key)).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('appends unknown categories in first-seen order', () => {
		const groups = groupWidgetsByCategory([
			makeWidget('x', 'weather'),
			makeWidget('y', 'audio'),
			makeWidget('z', 'weather'),
		]);
		expect(groups.map((group) => group.category)).toEqual(['weather', 'audio']);
		expect(groups[0].widgets.map((widget) => widget.key)).toEqual(['x', 'z']);
		expect(groups[1].widgets.map((widget) => widget.key)).toEqual(['y']);
	});

	it('omits known categories without widgets', () => {
		const groups = groupWidgetsByCategory([makeWidget('spacer', 'misc')]);
		expect(groups.map((group) => group.category)).toEqual(['misc']);
	});

	it('returns an empty list for no widgets', () => {
		expect(groupWidgetsByCategory([])).toEqual([]);
	});

	it('keeps the CATEGORY_ORDER constant free of duplicates', () => {
		expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
	});
});

describe('getCategoryLabelKey', () => {
	it('maps a category to its dashboard i18n key', () => {
		expect(getCategoryLabelKey('gnss')).toBe('dashboard.categories.gnss');
	});
});
