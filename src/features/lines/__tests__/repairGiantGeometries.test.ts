import { LINE_MAX_POINTS, parseSpatiaLiteBlob, partSizes } from '../db/repairGiantGeometries';

/** Build a synthetic SpatiaLite internal blob (little-endian LINESTRINGZ). */
const buildBlob = (
	coords: [
		number,
		number,
		number,
	][]
): string => {
	const count = coords.length;
	const bytes = new Uint8Array(47 + 1 + count * 24);
	bytes[0] = 0x00;
	bytes[1] = 0x01;
	// SRID 4326 little-endian
	bytes[2] = 0xe6;
	bytes[3] = 0x10;
	// MBR bytes left zero (repair doesn't read them)
	bytes[38] = 0x7c;
	// type 1002 LE
	bytes[39] = 0xea;
	bytes[40] = 0x03;
	// count LE
	bytes[43] = count % 256;
	bytes[44] = Math.floor(count / 256) % 256;
	bytes[45] = Math.floor(count / 65536) % 256;
	bytes[46] = Math.floor(count / 16777216) % 256;
	const view = new DataView(bytes.buffer);
	coords.forEach(
		(
			[
				lng,
				lat,
				z,
			],
			i
		) => {
			const off = 47 + i * 24;
			view.setFloat64(off, lng, true);
			view.setFloat64(off + 8, lat, true);
			view.setFloat64(off + 16, z, true);
		}
	);
	// trailing end-marker
	bytes[bytes.length - 1] = 0xfe;
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
};

describe('parseSpatiaLiteBlob', () => {
	it('decodes coordinates from a valid LINESTRINGZ blob', () => {
		const coords: [
			number,
			number,
			number,
		][] = [
			[
				8.5,
				50.25,
				120.5,
			],
			[
				8.6,
				50.3,
				121.5,
			],
			[
				8.7,
				50.35,
				122.5,
			],
		];
		const hex = buildBlob(coords);
		const parsed = parseSpatiaLiteBlob(hex);
		expect(parsed).toEqual(coords);
	});

	it('rejects blobs with a wrong length or type', () => {
		const hex = buildBlob([
			[
				8.5,
				50.25,
				120.5,
			],
			[
				8.6,
				50.3,
				121.5,
			],
		]);
		// Truncated
		expect(parseSpatiaLiteBlob(hex.slice(0, -2))).toBeNull();
		// Wrong WKB type (2002 = MultiLineStringZ)
		const wrongType = hex.slice(0, 78) + 'd2070000' + hex.slice(86);
		expect(parseSpatiaLiteBlob(wrongType)).toBeNull();
		// Not a 7c-marked blob
		expect(parseSpatiaLiteBlob('deadbeef')).toBeNull();
	});
});

describe('partSizes', () => {
	it('returns the count itself when under the limit', () => {
		expect(partSizes(10)).toEqual([10]);
		expect(partSizes(LINE_MAX_POINTS)).toEqual([LINE_MAX_POINTS]);
	});

	it('splits into full-sized parts with a tail', () => {
		const sizes = partSizes(LINE_MAX_POINTS * 2 + 100);
		expect(sizes).toEqual([
			LINE_MAX_POINTS,
			LINE_MAX_POINTS,
			100,
		]);
	});

	it('folds a single-point tail into the previous part', () => {
		const sizes = partSizes(LINE_MAX_POINTS * 2 + 1);
		expect(sizes).toEqual([LINE_MAX_POINTS, LINE_MAX_POINTS + 1]);
		// Every part keeps ≥ 2 points
		expect(sizes.every((s) => s >= 2)).toBe(true);
	});

	it('sums back to the original count', () => {
		for (const count of [
			5,
			50000,
			LINE_MAX_POINTS * 2 + 1,
			LINE_MAX_POINTS * 6 + 999,
		]) {
			const sizes = partSizes(count);
			expect(sizes.reduce((a, b) => a + b, 0)).toBe(count);
		}
	});
});
