/**
 * Deterministic tag coloring.
 *
 * Tags without an explicit color stored in `tag.data.color` get a color
 * from the built-in palette based on a hash of their label.  Tags with
 * `tag.data.color` use that hex value directly.
 */

/**
 * Internal dependencies
 */
import type { PaletteColor } from '../../../components/ColorPalette/palette';
import { PALETTE_COLORS } from '../../../components/ColorPalette/palette';

export type { PaletteColor };
export { PALETTE_COLORS };

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
export const getTagColor = (tag: {
	id?: number;
	label?: string | null;
	data?: any;
}): PaletteColor => {
	// Explicit colour stored in tag data
	if (typeof tag.data?.color === 'string' && tag.data.color.length > 0) {
		let hex = tag.data.color as string;
		// Ensure leading # so the length-based normalisation and
		// hex.slice(1,3) parsing below always target the right bytes.
		if (!hex.startsWith('#')) {
			hex = '#' + hex;
		}
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
	const idx = hashLabel(label) % PALETTE_COLORS.length;
	return PALETTE_COLORS[idx];
};
