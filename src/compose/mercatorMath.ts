/**
 * Plain-JS Mercator projection utilities for computing the geographic bounding
 * box of the visible map viewport.
 *
 * The map library (`react-native-mapsforge-vtm`) provides worklet-only
 * `toScreenPosition` / `fromScreenPosition` that take `SharedValue` params.
 * This module extracts the same math into pure functions taking raw numbers,
 * so they can be called from React hooks and event handlers.
 *
 * Bearing and tilt are fully accounted for. When the map is north-up and
 * untilted, the formulas reduce to standard Web Mercator projection.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Clamps a latitude to the Web Mercator valid range [-85.051129°, +85.051129°].
 * Values outside this range map to infinity in Mercator Y and produce NaN.
 */
function clampLat(lat: number): number {
	const max = 85.0511287798066;
	if (lat > max) return max;
	if (lat < -max) return -max;
	return lat;
}

/**
 * Converts a geographic lat/lng point to normalised Mercator coordinates.
 *
 * Normalised range: mx ∈ [0, 1], my ∈ [0, 1].
 * mx=0 is the antimeridian (-180°), mx=1 wraps back to the antimeridian.
 * my=0 is the north pole (~85.05°), my=1 is the south pole (~-85.05°).
 */
export function latLngToMercator(lat: number, lng: number): { mx: number; my: number } {
	const mx = (lng + 180) / 360;
	const latRad = clampLat(lat) * DEG_TO_RAD;
	const mercY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
	const my = 0.5 - mercY / (2 * Math.PI);
	return { mx, my };
}

/**
 * Converts normalised Mercator coordinates back to geographic lat/lng.
 */
export function mercatorToLatLng(mx: number, my: number): { lat: number; lng: number } {
	const lng = mx * 360 - 180;
	const mercY = (0.5 - my) * 2 * Math.PI;
	const latRad = 2 * Math.atan(Math.exp(mercY)) - Math.PI / 2;
	const lat = latRad * RAD_TO_DEG;
	return { lat, lng };
}

/**
 * Converts screen pixel coordinates (dp) back to a geographic lat/lng point.
 *
 * This is the inverse of the library's `toScreenPosition`. Bearing and tilt
 * are fully accounted for. When bearing=0 and tilt=0, this reduces to plain
 * Web Mercator inverse projection.
 *
 * @param center - Map center as `[lng, lat]`.
 * @param zoom - Current zoom level.
 * @param viewportWidth - Map viewport width in dp.
 * @param viewportHeight - Map viewport height in dp.
 * @param bearing - Map bearing in degrees (0 = north-up, clockwise).
 * @param tilt - Map tilt in degrees (0 = top-down).
 * @param screenPoint - Screen coordinates in dp.
 * @returns `{ lat, lng }`, or `null` if the projection cannot be computed.
 */
export function fromScreenPosition(
	center: [number, number],
	zoom: number,
	viewportWidth: number,
	viewportHeight: number,
	bearing: number,
	tilt: number,
	screenPoint: { x: number; y: number }
): { lat: number; lng: number } | null {
	if (!center || center.length < 2) return null;
	if (zoom <= 0) return null;
	if (viewportWidth <= 0 || viewportHeight <= 0) return null;

	// Screen offset from viewport centre.
	const sx = screenPoint.x - viewportWidth / 2;
	const sy = screenPoint.y - viewportHeight / 2;

	// Undo tilt: reverse the orthographic y-foreshortening.
	const tiltRad = tilt * DEG_TO_RAD;
	const cosT = Math.cos(tiltRad);
	const ry = cosT > 0.001 ? sy / cosT : sy; // guard div-by-zero at ~90° tilt

	// Undo rotation: rotate screen offset by -bearing.
	const bearingRad = bearing * DEG_TO_RAD;
	const cosB = Math.cos(bearingRad);
	const sinB = Math.sin(bearingRad);
	const dx = cosB * sx + sinB * ry;
	const dy = -sinB * sx + cosB * ry;

	const worldPx = 256 * Math.pow(2, zoom);

	const centerMerc = latLngToMercator(center[1], center[0]);

	const dMx = dx / worldPx;
	const dMy = dy / worldPx;

	const pointMx = centerMerc.mx + dMx;
	const pointMy = centerMerc.my + dMy;

	return mercatorToLatLng(pointMx, pointMy);
}

/**
 * Geographic bounding box (axis-aligned).
 * `[west, south, east, north]` in degrees.
 */
export type ViewportBbox = [
	number,
	number,
	number,
	number,
];

/**
 * Computes the axis-aligned geographic bounding box of the visible viewport.
 *
 * Projects the four screen corners to lat/lng and takes the min/max extent.
 * With bearing/tilt, the true visible area is a rotated trapezoid, so the
 * AABB is larger than the true visible footprint — this is safe for culling
 * (may include a few extra off-screen lines, but never misses one).
 *
 * Returns `null` when the projection cannot be computed (no map position yet,
 * zero viewport dimensions, etc.).
 */
export function computeViewportBbox(
	center: [number, number],
	zoom: number,
	viewportWidth: number,
	viewportHeight: number,
	bearing: number,
	tilt: number
): ViewportBbox | null {
	const corners = [
		{ x: 0, y: 0 },
		{ x: viewportWidth, y: 0 },
		{ x: viewportWidth, y: viewportHeight },
		{ x: 0, y: viewportHeight },
	];

	const points: { lat: number; lng: number }[] = [];
	for (const c of corners) {
		const pt = fromScreenPosition(
			center,
			zoom,
			viewportWidth,
			viewportHeight,
			bearing,
			tilt,
			c
		);
		if (!pt) return null;
		points.push(pt);
	}

	let minLng = Infinity;
	let maxLng = -Infinity;
	let minLat = Infinity;
	let maxLat = -Infinity;

	for (const p of points) {
		if (p.lng < minLng) minLng = p.lng;
		if (p.lng > maxLng) maxLng = p.lng;
		if (p.lat < minLat) minLat = p.lat;
		if (p.lat > maxLat) maxLat = p.lat;
	}

	return [
		minLng,
		minLat,
		maxLng,
		maxLat,
	];
}

// ---------------------------------------------------------------------------
// Tile-grid snapping
// ---------------------------------------------------------------------------

/**
 * Returns the Web Mercator tile coordinates for a geographic point at the
 * given zoom level.  Standard OSM / Google tile scheme.
 */
export function lngLatToTile(lng: number, lat: number, zoom: number): { x: number; y: number } {
	const n = Math.pow(2, zoom);
	const x = ((lng + 180) / 360) * n;
	const latRad = (lat * Math.PI) / 180;
	const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
	return { x: x, y: y };
}

/**
 * Returns the geographic bounding box of a single tile.
 */
export function tileToBbox(tx: number, ty: number, zoom: number): ViewportBbox {
	const n = Math.pow(2, zoom);
	const west = (tx / n) * 360 - 180;
	const east = ((tx + 1) / n) * 360 - 180;
	const northRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
	const southRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 1)) / n)));
	const north = (northRad * 180) / Math.PI;
	const south = (southRad * 180) / Math.PI;
	return [
		west,
		south,
		east,
		north,
	];
}

/**
 * Snaps a geographic bbox to Web Mercator tile boundaries at `tileZoom`.
 * Returns the smallest bbox that fully contains the input and is aligned
 * to tile edges.
 *
 * Small pans within the same tile(s) produce the same snapped bbox, so
 * the React Query key stays stable and no unnecessary DB query fires.
 * Tile zoom is zoom-aware — coarser at low zoom, finer at high zoom.
 */
export function snapBboxToTiles(bbox: ViewportBbox, tileZoom: number): ViewportBbox {
	const z = Math.max(0, Math.round(tileZoom));
	const nw = lngLatToTile(bbox[0], bbox[3], z); // west, north
	const se = lngLatToTile(bbox[2], bbox[1], z); // east, south

	const minTx = Math.floor(Math.min(nw.x, se.x));
	const maxTx = Math.floor(Math.max(nw.x, se.x));
	const minTy = Math.floor(Math.min(nw.y, se.y));
	const maxTy = Math.floor(Math.max(nw.y, se.y));

	const topLeft = tileToBbox(minTx, minTy, z);
	const bottomRight = tileToBbox(maxTx, maxTy, z);

	return [
		topLeft[0],
		bottomRight[1],
		bottomRight[2],
		topLeft[3],
	];
}
