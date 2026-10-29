/**
 * Shared triangle-marker SVG generation for the GNSS position marker
 * (native LayerMarker filePath) and the marker control's live preview.
 */

/** Default marker canvas in dp — the 14x26 triangle in a 26x26 square. */
export const MARKER_DEFAULT_SIZE_DP = 26;

/** Static north-up triangle; the native marker's `rotation` turns it. */
export const buildMarkerSvg = (
	size: number,
	fillColor: string,
	strokeColor: string = '#000000'
): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${MARKER_DEFAULT_SIZE_DP} ${MARKER_DEFAULT_SIZE_DP}"><polygon points="13,1 7,25 19,25" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
