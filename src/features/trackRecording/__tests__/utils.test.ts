/**
 * Tests for trackRecording pure utils.
 */

/**
 * Internal dependencies
 */
import { toTrackCoord } from '../utils';

describe('toTrackCoord', () => {
	it('keeps a numeric altitude', () => {
		expect(toTrackCoord(1.5, 2.5, 123)).toEqual([
			1.5,
			2.5,
			123,
		]);
	});

	it('falls back to 0 for null altitude', () => {
		expect(toTrackCoord(1.5, 2.5, null)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('falls back to 0 for undefined altitude', () => {
		expect(toTrackCoord(1.5, 2.5, undefined)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('keeps 0 altitude', () => {
		expect(toTrackCoord(1.5, 2.5, 0)).toEqual([
			1.5,
			2.5,
			0,
		]);
	});

	it('always returns exactly 3 numbers', () => {
		const coord = toTrackCoord(8, 50, null);
		expect(coord).toHaveLength(3);
		coord.forEach((v) => expect(typeof v).toBe('number'));
	});
});
