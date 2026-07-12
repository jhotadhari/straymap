export interface PaletteColor {
	bg: string;
	fg: string;
	border: string;
}

/**
 * 10-colour palette with matching foreground/border tones.
 * Hues spaced ~40° apart, all at 100% HSL saturation for maximum vividness.
 */
export const PALETTE_COLORS: PaletteColor[] = [
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
