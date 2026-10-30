/**
 * Chevron marker SVG for the recording line.
 *
 * The native marker renders this north-up (tip at the top) at rotation 0;
 * the per-marker `rotation` paint (travel bearing, degrees clockwise from
 * north) turns it along the recorded direction — same convention as the
 * GNSS position marker (gnss/markerSvg.ts).
 */

/** Chevron canvas in dp — a 10x10 square, matching the recording band height. */
export const RECORDING_CHEVRON_SIZE_DP = 10;

export const buildRecordingChevronSvg = (): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${RECORDING_CHEVRON_SIZE_DP}" height="${RECORDING_CHEVRON_SIZE_DP}" viewBox="0 0 ${RECORDING_CHEVRON_SIZE_DP} ${RECORDING_CHEVRON_SIZE_DP}"><polyline points="1.4,9.2 5,1 8.6,9.2" fill="none" stroke="#FF4444" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
