/**
 * Deterministic tag coloring.
 *
 * Tags without an explicit color stored in `tag.data.color` get a color
 * from the built-in palette based on a hash of their label.  Tags with
 * `tag.data.color` use that hex value directly.
 */

export interface TagColors {
	bg: string;
	fg: string;
	border: string;
}

/**
 * 10-colour palette with matching foreground/border tones.
 * Hues spaced ~40° apart, all at 100% HSL saturation for maximum vividness.
 */
export const TAG_COLORS: TagColors[] = [
	{ bg: '#F50000', fg: '#FFFFFF', border: '#B80000' }, // red       (0°)
	{ bg: '#FFAA00', fg: '#3D1F00', border: '#CC8800' }, // orange   (40°)
	{ bg: '#8CD600', fg: '#1F3300', border: '#6BA600' }, // chartreuse (80°)
	{ bg: '#00DB00', fg: '#003300', border: '#00A800' }, // green    (120°)
	{ bg: '#00C280', fg: '#003325', border: '#009960' }, // teal     (160°)
	{ bg: '#0099E6', fg: '#FFFFFF', border: '#0077B8' }, // azure    (200°)
	{ bg: '#1A1AFF', fg: '#FFFFFF', border: '#0000CC' }, // blue     (240°)
	{ bg: '#8000FF', fg: '#FFFFFF', border: '#6000CC' }, // violet   (280°)
	{ bg: '#F500A3', fg: '#FFFFFF', border: '#B8007A' }, // magenta  (320°)
	{ bg: '#F50057', fg: '#FFFFFF', border: '#B8003F' }, // rose     (340°)
];

/**
 * Simple string hash → palette index.  Deterministic for the same label.
 */
const hashLabel = (label: string): number => {
	let hash = 0;
	for (let i = 0; i < label.length; i++) {
		hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
};

/**
 * Return background/foreground/border colours for a tag.
 *
 * Priority:
 * 1. Explicit `tag.data.color` (hex, e.g. "#ff6600")
 * 2. Deterministic palette colour from the tag's label
 */
export const getTagColor = (tag: { id?: number; label?: string | null; data?: any }): TagColors => {
	// Explicit colour stored in tag data
	if (typeof tag.data?.color === 'string' && tag.data.color.length > 0) {
		let hex = tag.data.color as string;
		// Normalize 3-digit shorthand (#RGB) and 8-digit (#RRGGBBAA) to 6-digit
		if (hex.length === 4) {
			hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
		} else if (hex.length === 9) {
			hex = hex.slice(0, 7);
		}
		// Parse RRGGBB components
		const r = parseInt(hex.slice(1, 3), 16) || 0;
		const g = parseInt(hex.slice(3, 5), 16) || 0;
		const b = parseInt(hex.slice(5, 7), 16) || 0;
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return {
			bg: hex,
			fg: luminance > 0.5 ? '#1F2937' : '#F9FAFB',
			border: hex,
		};
	}

	// Deterministic from label
	const label = tag.label ?? '';
	const idx = hashLabel(label) % TAG_COLORS.length;
	return TAG_COLORS[idx];
};
