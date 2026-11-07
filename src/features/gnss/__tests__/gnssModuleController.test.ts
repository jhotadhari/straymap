/**
 * Tests for the GNSS module lifecycle controller's pure filter rule.
 */

/**
 * Internal dependencies
 */
import { resolveGnssFilter, GnssControllerState } from '../gnssModuleController';

const base: GnssControllerState = {
	gnssIsActive: false,
	isRecording: false,
	resumePending: false,
	surfacePresent: true,
	minDistance: 5,
	minTime: 2,
	minPrecision: 20,
	useDemAltitude: true,
};

describe('resolveGnssFilter', () => {
	it('stops the listener when nothing is active', () => {
		expect(resolveGnssFilter({ ...base })).toBeNull();
	});

	it('uses the relaxed idle filter for plain GNSS activation', () => {
		expect(resolveGnssFilter({ ...base, gnssIsActive: true })).toEqual({
			minDistanceMeters: 0,
			minTimeSec: 1,
			minAccuracyMeters: 100,
			provider: 'satellite',
			altitudeSource: 'dem-preferred',
		});
	});

	it('uses the recording gate while recording', () => {
		expect(resolveGnssFilter({ ...base, isRecording: true })).toEqual({
			minDistanceMeters: 5,
			minTimeSec: 2,
			minAccuracyMeters: 20,
			provider: 'satellite',
			altitudeSource: 'dem-preferred',
		});
	});

	it('uses gnss-only altitude when the DEM toggle is off', () => {
		expect(resolveGnssFilter({ ...base, isRecording: true, useDemAltitude: false })).toEqual(
			expect.objectContaining({ altitudeSource: 'gnss-only' })
		);
	});

	it('stops plain GNSS when the surface is gone (battery rule)', () => {
		expect(
			resolveGnssFilter({ ...base, gnssIsActive: true, surfacePresent: false })
		).toBeNull();
	});

	it('keeps a recording alive without a surface (background recording)', () => {
		expect(resolveGnssFilter({ ...base, isRecording: true, surfacePresent: false })).toEqual(
			expect.objectContaining({ minDistanceMeters: 5 })
		);
	});

	it('keeps a pending resume alive without a surface', () => {
		expect(
			resolveGnssFilter({ ...base, resumePending: true, surfacePresent: false })
		).not.toBeNull();
	});

	it('the recording gate wins when recording and GNSS-on coexist', () => {
		expect(resolveGnssFilter({ ...base, gnssIsActive: true, isRecording: true })).toEqual(
			expect.objectContaining({ minDistanceMeters: 5 })
		);
	});
});
