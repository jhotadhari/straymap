/**
 * Shared marker SVG generation for the GNSS position marker
 * (native LayerMarker filePath) and the marker control's live preview.
 */

/** Default marker canvas in dp — the marker shapes fill a square of this size. */
export const MARKER_DEFAULT_SIZE_DP = 26;

/** Built-in marker shapes, all drawn north-up; the native marker's `rotation` turns them. */
export type MarkerShape = 'materialNavigation' | 'materialNavigationOutline' | 'lucideNavigation';

/** All built-in marker shapes (custom svg/png file sources are not shapes). */
export const MARKER_SHAPES: MarkerShape[] = [
	'materialNavigation',
	'materialNavigationOutline',
	'lucideNavigation',
];

/**
 * Resolve a markerIconSource string to a marker shape, falling back to
 * the material navigation arrow (unknown values include legacy presets
 * that are no longer offered).
 */
export const markerSourceToShape = (iconSource: string): MarkerShape =>
	(MARKER_SHAPES as string[]).includes(iconSource)
		? (iconSource as MarkerShape)
		: 'materialNavigation';

/**
 * Static north-up marker SVG; the native marker's `rotation` turns it.
 *
 * Shapes reuse the original 24x24 glyph paths (MaterialIcons
 * "navigation", Lucide "navigation"). The Lucide arrow is pre-rotated
 * 45° so its apex points straight north at rotation 0 (the native
 * marker rotates the bitmap about its center). The outline arrow is
 * stroke-only: a black casing stroke underneath the colored stroke.
 */
export const buildMarkerSvg = (
	size: number,
	fillColor: string,
	strokeColor: string = '#000000',
	shape: MarkerShape = 'materialNavigation'
): string => {
	const body = (() => {
		switch (shape) {
			case 'materialNavigationOutline':
				// MaterialIcons "navigation" stroke-only, so the arrow
				// renders as an outline on any background.
				return `<path fill="none" stroke="${strokeColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/><path fill="none" stroke="${fillColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>`;
			case 'lucideNavigation':
				// Lucide "navigation" — the location arrow, pre-rotated 45°
				// counter-clockwise so the apex points north at rotation 0.
				return `<polygon points="4.93,21.8 12,2 19.07,21.8 12,17.55" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>`;
			case 'materialNavigation':
			default:
				// MaterialIcons "navigation" — filled arrow with a notched base.
				return `<path fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>`;
		}
	})();
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${body}</svg>`;
};
