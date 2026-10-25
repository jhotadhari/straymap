/**
 * External dependencies
 */
import { TFunction } from 'i18next';

/**
 * Internal dependencies
 */
import { formatCoords } from '../../lib/formatting';
import { UnitPref } from '../general/types';

export type ShareRow = {
	key: string;
	labelKey: string;
	value: string;
};

export const DEFAULT_SHARE_ZOOM = 18;

/**
 * Builds the share-position rows: coordinates (user's configured format),
 * plain decimal coordinates, and links into common map apps. Pure so it
 * can be unit-tested. The configured-format row always carries the
 * "global unit preference" label suffix, next to the plain-decimal row.
 */
export const buildShareRows = (
	lng: number,
	lat: number,
	zoomLevel: number | undefined,
	unitPref: UnitPref,
	t?: TFunction<'translation', undefined>
): ShareRow[] => {
	const zoom = Math.round(zoomLevel ?? DEFAULT_SHARE_ZOOM);
	const latStr = lat.toFixed(6);
	const lngStr = lng.toFixed(6);

	const rows: ShareRow[] = [
		{
			key: 'coordinates',
			labelKey: 'coordinatesUnitPref',
			value: formatCoords(lat, lng, unitPref, t).trim(),
		},
		{
			key: 'coordinatesDecimal',
			labelKey: 'coordinatesDecimal',
			value: `${latStr}, ${lngStr}`,
		},
	];

	rows.push(
		{
			key: 'openstreetmap',
			labelKey: 'openstreetmap',
			value: `https://www.openstreetmap.org/?mlat=${latStr}&mlon=${lngStr}#map=${zoom}/${latStr}/${lngStr}`,
		},
		{
			key: 'openTopoMap',
			labelKey: 'openTopoMap',
			value: `https://opentopomap.org/#marker=${zoom}/${latStr}/${lngStr}`,
		},
		{
			key: 'googleMaps',
			labelKey: 'googleMaps',
			value: `https://maps.google.com/maps?z=${zoom}&q=${latStr},${lngStr}`,
		},
		{
			key: 'osmand',
			labelKey: 'osmand',
			value: `https://osmand.net/go?lat=${latStr}&lon=${lngStr}&z=${zoom}`,
		},
		{
			key: 'geoUri',
			labelKey: 'geoUri',
			value: `geo:${latStr},${lngStr}?z=${zoom}`,
		}
	);

	return rows;
};
