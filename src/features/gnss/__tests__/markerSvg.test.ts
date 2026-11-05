/**
 * Tests for the GNSS marker SVG generation and shape resolution.
 */

/**
 * Internal dependencies
 */
import { buildMarkerSvg, MARKER_SHAPES, markerSourceToShape } from '../markerSvg';

describe('markerSvg', () => {
	it('builds every marker shape at the requested size', () => {
		MARKER_SHAPES.forEach((shape) => {
			const svg = buildMarkerSvg(26, '#123456', '#000000', shape);
			expect(svg).toContain('width="26"');
			expect(svg).toContain('height="26"');
			expect(svg).toContain('viewBox="0 0 24 24"');
		});
	});

	it('fills the solid arrows and strokes them black', () => {
		expect(buildMarkerSvg(26, '#123456', '#000000', 'materialNavigation')).toContain(
			'fill="#123456"'
		);
		expect(buildMarkerSvg(26, '#123456', '#000000', 'lucideNavigation')).toContain(
			'fill="#123456"'
		);
		expect(buildMarkerSvg(26, '#123456', '#000000', 'materialNavigation')).toContain(
			'stroke="#000000"'
		);
	});

	it('renders the outline arrow stroke-only with a casing', () => {
		const svg = buildMarkerSvg(26, '#123456', '#000000', 'materialNavigationOutline');
		expect(svg).toContain('fill="none"');
		// Colored stroke on top of the black casing stroke.
		expect(svg).toContain('stroke="#123456"');
		expect(svg).toContain('stroke="#000000"');
	});

	it('resolves markerIconSource strings to shapes with a fallback to the material arrow', () => {
		expect(markerSourceToShape('materialNavigation')).toBe('materialNavigation');
		expect(markerSourceToShape('materialNavigationOutline')).toBe('materialNavigationOutline');
		expect(markerSourceToShape('lucideNavigation')).toBe('lucideNavigation');
		// Custom file sources and unknown values (e.g. legacy presets)
		// fall back to the material navigation arrow.
		expect(markerSourceToShape('/marker/foo.svg')).toBe('materialNavigation');
		expect(markerSourceToShape('content://something.png')).toBe('materialNavigation');
		expect(markerSourceToShape('triangle')).toBe('materialNavigation');
		expect(markerSourceToShape('unknown')).toBe('materialNavigation');
	});
});
