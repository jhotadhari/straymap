/**
 * Chevron marker SVG for the recording line.
 *
 * The native marker renders this north-up (tip at the top) at rotation 0;
 * the per-marker `rotation` paint (travel bearing, degrees clockwise from
 * north) turns it along the recorded direction — same convention as the
 * GNSS position marker (gnss/markerSvg.ts).
 */

/** Chevron canvas size (dp) for a given recording line width. */
export const recordingChevronSizeDp = (width: number): number => width * 2;

/**
 * Build the chevron SVG for a recording line of the given width (dp) and
 * colour. The canvas is `2×width`; the stroke is `0.64×width` — at the
 * default width (4) this produces an 8 dp canvas / 2.56 stroke.
 */
export const buildRecordingChevronSvg = (width: number, color: string): string => {
	const size = recordingChevronSizeDp(width);
	const stroke = width * 0.64;
	const x1 = 0.14 * size;
	const y1 = 0.92 * size;
	const x2 = 0.5 * size;
	const y2 = 0.1 * size;
	const x3 = 0.86 * size;
	const y3 = 0.92 * size;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};
