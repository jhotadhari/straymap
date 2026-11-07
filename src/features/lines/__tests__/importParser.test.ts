import { detectImportFormat, parseImportContent } from '../utils/importParser';

describe('importParser', () => {
	describe('detectImportFormat', () => {
		it('detects supported extensions case-insensitively', () => {
			expect(detectImportFormat('track.GPX')).toBe('gpx');
			expect(detectImportFormat('track.kml')).toBe('kml');
			expect(detectImportFormat('track.geojson')).toBe('geojson');
			expect(detectImportFormat('track.json')).toBe('geojson');
			expect(detectImportFormat('track.txt')).toBeNull();
		});
	});

	describe('parseImportContent gpx', () => {
		const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Morning ride</name>
    <time>2023-01-01T08:00:00Z</time>
    <trkseg>
      <trkpt lat="50.0" lon="8.0">
        <ele>100.5</ele>
        <time>2023-01-01T08:00:00Z</time>
      </trkpt>
      <trkpt lat="50.1" lon="8.1">
        <ele>101.5</ele>
        <time>2023-01-01T08:01:00Z</time>
      </trkpt>
      <trkpt lat="50.2" lon="8.2">
        <time>2023-01-01T08:02:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

		it('parses tracks with coordinates, elevation and aligned times', () => {
			const result = parseImportContent(gpxContent, 'gpx');
			expect(result.features).toHaveLength(1);
			const feature = result.features[0];
			expect(feature.properties?.name).toBe('Morning ride');
			expect(feature.properties?._gpxType).toBe('trk');
			expect(feature.geometry.coordinates).toEqual([
				[
					8.0,
					50.0,
					100.5,
				],
				[
					8.1,
					50.1,
					101.5,
				],
				[8.2, 50.2],
			]);
			expect(result.isMulti).toBe(false);
			expect(result.times).toHaveLength(1);
			const times = result.times[0];
			expect(times).not.toBeNull();
			expect(times).toHaveLength(3);
			// 2023-01-01T08:00:00Z epoch ms
			expect(times![0]).toBe(new Date('2023-01-01T08:00:00Z').getTime());
			expect(times![2]).toBe(new Date('2023-01-01T08:02:00Z').getTime());
		});

		it('drops times when not every point has one', () => {
			const gpx = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="50.0" lon="8.0"><time>2023-01-01T08:00:00Z</time></trkpt>
  <trkpt lat="50.1" lon="8.1"></trkpt>
</trkseg></trk></gpx>`;
			const result = parseImportContent(gpx, 'gpx');
			expect(result.features).toHaveLength(1);
			expect(result.times[0]).toBeNull();
		});

		it('emits one feature per trkseg with per-segment times', () => {
			const gpx = `<?xml version="1.0"?>
<gpx><trk><name>Two legs</name>
  <trkseg>
    <trkpt lat="50.0" lon="8.0"><time>2023-01-01T08:00:00Z</time></trkpt>
    <trkpt lat="50.1" lon="8.1"><time>2023-01-01T08:01:00Z</time></trkpt>
  </trkseg>
  <trkseg>
    <trkpt lat="50.2" lon="8.2"><time>2023-01-01T09:00:00Z</time></trkpt>
    <trkpt lat="50.3" lon="8.3"><time>2023-01-01T09:01:00Z</time></trkpt>
  </trkseg>
</trk></gpx>`;
			const result = parseImportContent(gpx, 'gpx');
			expect(result.features).toHaveLength(2);
			expect(result.isMulti).toBe(true);
			expect(result.features[0].properties?.name).toBe('Two legs');
			expect(result.times[0]![0]).toBe(new Date('2023-01-01T08:00:00Z').getTime());
			expect(result.times[1]![0]).toBe(new Date('2023-01-01T09:00:00Z').getTime());
		});

		it('parses routes', () => {
			const gpx = `<?xml version="1.0"?>
<gpx><rte><name>Route A</name>
  <rtept lat="50.0" lon="8.0"><time>2023-01-01T08:00:00Z</time></rtept>
  <rtept lat="50.1" lon="8.1"><time>2023-01-01T08:01:00Z</time></rtept>
</rte></gpx>`;
			const result = parseImportContent(gpx, 'gpx');
			expect(result.features).toHaveLength(1);
			expect(result.features[0].properties?._gpxType).toBe('rte');
			expect(result.times[0]).toHaveLength(2);
		});

		it('falls back gracefully on malformed xml', () => {
			const result = parseImportContent('this is not xml at all <<<', 'gpx');
			expect(result.features).toHaveLength(0);
		});
	});

	describe('parseImportContent geojson', () => {
		it('keeps existing GeoJSON behavior', () => {
			const geojson = JSON.stringify({
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: { name: 'Test line' },
						geometry: {
							type: 'LineString',
							coordinates: [
								[8.0, 50.0],
								[8.1, 50.1],
							],
						},
					},
				],
			});
			const result = parseImportContent(geojson, 'geojson');
			expect(result.features).toHaveLength(1);
			expect(result.features[0].properties?.name).toBe('Test line');
			expect(result.times[0]).toBeNull();
		});
	});
});
