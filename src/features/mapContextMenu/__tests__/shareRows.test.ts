/**
 * Tests for shareRows.ts — pure row builders, no native deps.
 */

/**
 * Internal dependencies
 */
import { UnitPref } from '../../general/types';
import { buildShareRows, DEFAULT_SHARE_ZOOM } from '../shareRows';

const LAT = 48.1234567;
const LNG = 11.1234567;

const ddUnitPref: UnitPref = { unit: 'dd', round: 4 };
const dmsUnitPref: UnitPref = { unit: 'dms', round: 0 };

describe('buildShareRows', () => {
	it('returns the expected row keys in order', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows.map((row) => row.key)).toEqual([
			'coordinates',
			'coordinatesDecimal',
			'openstreetmap',
			'openTopoMap',
			'googleMaps',
			'osmand',
			'geoUri',
		]);
	});

	it('labels the coordinates row with the unit-pref suffix', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[0].labelKey).toBe('coordinatesUnitPref');
	});

	it('labels the coordinates row with the unit-pref suffix for dms too', () => {
		const rows = buildShareRows(LNG, LAT, 17, dmsUnitPref);
		expect(rows[0].labelKey).toBe('coordinatesUnitPref');
	});

	it('formats coordinates with the configured format (dd)', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[0].value).toBe('48.1235° N 11.1235° E');
	});

	it('formats coordinates with the configured format (dms)', () => {
		const rows = buildShareRows(LNG, LAT, 17, dmsUnitPref);
		expect(rows[0].value).toBe('48° 7′ 24″ N 11° 7′ 24″ E');
	});

	it('renders plain decimal coordinates', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[1].value).toBe('48.123457, 11.123457');
	});

	it('builds the OpenStreetMap link with marker and zoom', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[2].value).toBe(
			'https://www.openstreetmap.org/?mlat=48.123457&mlon=11.123457#map=17/48.123457/11.123457'
		);
	});

	it('builds the Google Maps link', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[4].value).toBe('https://maps.google.com/maps?z=17&q=48.123457,11.123457');
	});

	it('builds the OpenTopoMap link with marker and zoom', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[3].value).toBe('https://opentopomap.org/#marker=17/48.123457/11.123457');
	});

	it('builds the OsmAnd link', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[5].value).toBe('https://osmand.net/go?lat=48.123457&lon=11.123457&z=17');
	});

	it('builds the geo URI', () => {
		const rows = buildShareRows(LNG, LAT, 17, ddUnitPref);
		expect(rows[6].value).toBe('geo:48.123457,11.123457?z=17');
	});

	it('falls back to the default zoom when zoomLevel is undefined', () => {
		const rows = buildShareRows(LNG, LAT, undefined, ddUnitPref);
		expect(rows[6].value).toBe(`geo:48.123457,11.123457?z=${DEFAULT_SHARE_ZOOM}`);
	});

	it('rounds fractional zoom levels', () => {
		const rows = buildShareRows(LNG, LAT, 17.6, ddUnitPref);
		expect(rows[6].value).toBe('geo:48.123457,11.123457?z=18');
	});
});
