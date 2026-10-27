/**
 * Tests for src/lib/formatting.ts bearing helpers — pure math, no native deps.
 */

/**
 * Internal dependencies
 */
import { bearingBetween, formatBearing } from '../formatting';

describe('bearingBetween', () => {
	it('returns 0° (north) for a point due north', () => {
		expect(bearingBetween([7, 47], [7, 48])).toBeCloseTo(0, 5);
	});

	it('returns ~90° (east) for a point due east', () => {
		// Great-circle initial bearing at 47° latitude curves slightly
		// south of due east.
		expect(bearingBetween([7, 47], [8, 47])).toBeCloseTo(89.634, 3);
	});

	it('returns 180° (south) for a point due south', () => {
		expect(bearingBetween([7, 47], [7, 46])).toBeCloseTo(180, 5);
	});

	it('returns ~270° (west) for a point due west', () => {
		expect(bearingBetween([7, 47], [6, 47])).toBeCloseTo(270.366, 3);
	});

	it('wraps into 0-360 (south-west)', () => {
		expect(bearingBetween([7, 47], [6, 46])).toBeCloseTo(214.905, 3);
	});

	it('accepts { lng, lat } objects', () => {
		expect(bearingBetween({ lng: 7, lat: 47 }, { lng: 8, lat: 47 })).toBeCloseTo(89.634, 3);
	});

	it('is roughly anti-parallel for the reverse direction', () => {
		const fwd = bearingBetween([7, 47], [8.5, 47.5]);
		const rev = bearingBetween([8.5, 47.5], [7, 47]);
		// Reverse initial bearing differs from fwd + 180 by the
		// meridional convergence (~1.1° at this separation).
		expect(Math.abs(rev - ((fwd + 180) % 360))).toBeLessThan(2);
	});
});

describe('formatBearing', () => {
	it('formats with the degree sign and no decimals by default', () => {
		expect(formatBearing(89.6)).toBe('90°');
		expect(formatBearing(0)).toBe('0°');
	});

	it('respects the round argument', () => {
		expect(formatBearing(89.64, 1)).toBe('89.6°');
	});
});
