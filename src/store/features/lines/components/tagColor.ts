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
 * 12-colour palette with matching foreground/border tones.
 * Each entry has enough contrast for dark-text-on-light-bg readability.
 */
export const TAG_COLORS: TagColors[] = [
	{ bg: '#FDE68A', fg: '#78350F', border: '#D97706' }, // amber
	{ bg: '#BFDBFE', fg: '#1E3A5F', border: '#2563EB' }, // blue
	{ bg: '#BBF7D0', fg: '#14532D', border: '#16A34A' }, // green
	{ bg: '#FECACA', fg: '#7F1D1D', border: '#DC2626' }, // red
	{ bg: '#E9D5FF', fg: '#4C1D95', border: '#9333EA' }, // purple
	{ bg: '#FED7AA', fg: '#7C2D12', border: '#EA580C' }, // orange
	{ bg: '#A5F3FC', fg: '#164E63', border: '#0891B2' }, // cyan
	{ bg: '#FECDD3', fg: '#831843', border: '#DB2777' }, // pink
	{ bg: '#D9F99D', fg: '#365314', border: '#65A30D' }, // lime
	{ bg: '#E5E7EB', fg: '#1F2937', border: '#6B7280' }, // gray
	{ bg: '#DDD6FE', fg: '#312E81', border: '#7C3AED' }, // indigo
	{ bg: '#FED7E2', fg: '#701A3F', border: '#BE185D' }, // rose
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
export const getTagColor = (tag: {
	id?: number;
	label?: string | null;
	data?: any;
}): TagColors => {
	// Explicit colour stored in tag data
	if (typeof tag.data?.color === 'string' && tag.data.color.length > 0) {
		const hex = tag.data.color as string;
		// Simple luminance check — if the hex looks dark, use white text
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
