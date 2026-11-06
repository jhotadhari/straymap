/**
 * Tests for the export format writers (GPX/KML/GeoJSON), focused on the
 * per-point timestamp support added for recorded tracks.
 */

/**
 * Internal dependencies
 */
import { LineString } from 'geojson';
import { alignPointsToCoords, toGeoJson, toGpx } from '../utils/formatWriters';

const geometry: LineString = {
	type: 'LineString',
	coordinates: [
		[
			10,
			50,
			100,
		],
		[
			11,
			51,
			200,
		],
		[
			12,
			52,
			300,
		],
	],
};

describe('toGpx', () => {
	it('emits ele only when no per-point metadata exists', () => {
		const gpx = toGpx([{ geometry }]);
		expect(gpx).toContain('<trkpt lat="50" lon="10">');
		expect(gpx).toContain('<ele>100</ele>');
		expect(gpx).not.toContain('<time>');
	});

	it('emits <time> per trkpt from aligned metadata', () => {
		const points = alignPointsToCoords(geometry.coordinates, [
			{ point_index: 0, timestamp: 1_700_000_000_000, speed: null, gnss_altitude: null },
			{ point_index: 2, timestamp: 1_700_000_000_002, speed: 5, gnss_altitude: 290 },
		]);
		const gpx = toGpx([{ geometry, points }]);
		// Index 0 has a timestamp; index 1 has none (null).
		expect(gpx).toContain('<time>2023-11-14T22:13:20.000Z</time>');
		expect(gpx).toContain('<time>2023-11-14T22:13:20.002Z</time>');
		// Exactly two <time> elements.
		expect(gpx.match(/<time>/g)).toHaveLength(2);
	});

	it('aligns rows by point_index into a dense parallel array', () => {
		const aligned = alignPointsToCoords(geometry.coordinates, [
			{ point_index: 2, timestamp: 1, speed: null, gnss_altitude: null },
		]);
		expect(aligned).toHaveLength(3);
		expect(aligned?.[0]).toBeNull();
		expect(aligned?.[2]?.timestamp).toBe(1);
	});

	it('returns undefined when there are no rows', () => {
		expect(alignPointsToCoords(geometry.coordinates, [])).toBeUndefined();
		expect(alignPointsToCoords(geometry.coordinates, null)).toBeUndefined();
	});
});

describe('toGeoJson', () => {
	it('adds coordTimes parallel to coordinates when timestamps exist', () => {
		const points = alignPointsToCoords(geometry.coordinates, [
			{ point_index: 0, timestamp: 1_700_000_000_000, speed: null, gnss_altitude: null },
			{ point_index: 1, timestamp: 1_700_000_000_001, speed: 1, gnss_altitude: null },
			{ point_index: 2, timestamp: 1_700_000_000_002, speed: 2, gnss_altitude: null },
		]);
		const parsed = JSON.parse(toGeoJson([{ geometry, points }]));
		const props = parsed.features[0].properties;
		expect(props.coordTimes).toHaveLength(3);
		expect(props.coordTimes[0]).toBe('2023-11-14T22:13:20.000Z');
	});

	it('omits coordTimes when there is no per-point metadata', () => {
		const parsed = JSON.parse(toGeoJson([{ geometry }]));
		expect(parsed.features[0].properties.coordTimes).toBeUndefined();
	});
});
