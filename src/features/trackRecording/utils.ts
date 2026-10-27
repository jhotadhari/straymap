/**
 * Normalize a GNSS position to the app's canonical 3D coordinate
 * `[lng, lat, z]`.  Missing altitude becomes 0 — the DB schema enforces
 * POINTZ / LINESTRINGZ (3D), and mixing 2D/3D geometries makes
 * SpatiaLite's ST_AddPoint throw on every append (the recording would
 * freeze at its first two points).
 */
export const toTrackCoord = (
	lng: number,
	lat: number,
	altitude: number | null | undefined
): [
	number,
	number,
	number,
] => [
	lng,
	lat,
	altitude ?? 0,
];
