export interface PaletteColor {
	bg: string;
	fg: string;
	border: string;
}

/**
 * 10-colour palette with matching foreground/border tones.
 * Hues mostly spaced 45° apart around the colour wheel, all at 100% HSL
 * saturation. Background lightness is 48 % except yellow which uses 55 %
 * for full brightness. Borders use the same hue/saturation at 34 %
 * lightness (yellow border at 36 %).
 */
export const PALETTE_COLORS: PaletteColor[] = [
	{ bg: '#F50000', fg: '#FFFFFF', border: '#AD0000' }, // red        (0°)
	{ bg: '#F5B800', fg: '#1A1A1A', border: '#AD8200' }, // orange     (45°)
	{ bg: '#FFF71A', fg: '#1A1A1A', border: '#B6B000' }, // yellow     (58°) 55% light
	{ bg: '#7AF500', fg: '#1A1A1A', border: '#57AD00' }, // chartreuse (90°)
	{ bg: '#00F53D', fg: '#1A1A1A', border: '#00AD2B' }, // lime-green (135°)
	{ bg: '#00F5B8', fg: '#1A1A1A', border: '#00AD82' }, // teal       (165°)
	{ bg: '#00F5F5', fg: '#1A1A1A', border: '#00ADAD' }, // cyan       (180°)
	{ bg: '#003DF5', fg: '#FFFFFF', border: '#002BAD' }, // blue       (225°)
	{ bg: '#7A00F5', fg: '#FFFFFF', border: '#5700AD' }, // violet     (270°)
	{ bg: '#F500B8', fg: '#FFFFFF', border: '#AD0082' }, // pink       (315°)
];
