/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { get } from 'lodash-es';
import RNFS from 'react-native-fs';
import { LayerMarker, Marker, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssHeading, selectGnssPosition, selectIsActive } from '../selectors';
import { selectAppDirs } from '../../dirs/selectors';
import { RECORDED_LINE_COLOR } from '../../../constants';
import { logError } from '../../../lib/utils';

/** Marker canvas in dp — the 14x26 triangle centered in a 26x26 square. */
const MARKER_SIZE_DP = 26;

const MARKER_FILE_NAME = 'gnssCenterMarker.svg';

/** Static north-up triangle; the marker's `rotation` turns it. */
const buildMarkerSvg = (): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE_DP}" height="${MARKER_SIZE_DP}" viewBox="0 0 ${MARKER_SIZE_DP} ${MARKER_SIZE_DP}"><polygon points="13,1 7,25 19,25" fill="${RECORDED_LINE_COLOR}" stroke="#000000" stroke-width="2"/></svg>`;

/**
 * GNSS position marker, rendered as a NATIVE marker so it is drawn by
 * the map itself every render frame — unlike the reanimated overlays, it
 * cannot lag behind the map content during fast pans.
 *
 * Visible whenever GNSS is active (independent of center mode — center
 * mode only controls the map re-centering and the panned-away line).
 *
 * The triangle shape comes from a static SVG file (written once into the
 * app's marker dir); the movement-direction rotation is applied natively
 * via the marker's `rotation` paint option (whole degrees).
 */
const GnssCenterMarker: FC = () => {
	const isActive = useAppSelector(selectIsActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const gnssHeading = useAppSelector(selectGnssHeading);
	const appDirs = useAppSelector(selectAppDirs);

	const markerDir = get(appDirs, ['marker', 0]) as string | undefined;

	const [filePath, setFilePath] = useState<string | null>(null);

	// Write the static SVG once (native decodes .svg filePaths directly).
	useEffect(() => {
		if (!markerDir) {
			return;
		}
		const path = `${markerDir}/${MARKER_FILE_NAME}`;
		let cancelled = false;
		(async () => {
			try {
				const exists = await RNFS.exists(path);
				if (!exists) {
					await RNFS.writeFile(path, buildMarkerSvg(), 'utf8');
				}
				if (!cancelled) {
					setFilePath(path);
				}
			} catch (err) {
				logError('gnss/GnssCenterMarker', err);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [markerDir]);

	// The native marker canvas is raw pixels — scale dp by density.
	const sizePx = useMemo(() => Math.round(MARKER_SIZE_DP * PixelRatio.get()), []);

	// Movement direction from consecutive fixes (slice-derived heading) —
	// the payload's velocity bearing is unreliable for pedestrian fixes.
	const rotation = gnssHeading ?? 0;

	const paint = useMemo(
		() =>
			filePath
				? {
						width: sizePx,
						height: sizePx,
						filePath: filePath as `/${string}`,
						hotspotPlace: 'CENTER' as const,
						rotation,
					}
				: null,
		[
			filePath,
			sizePx,
			rotation,
		]
	);

	if (!isActive || !gnssPosition || !paint) {
		return null;
	}

	return (
		// Explicit scope order: the base map layer renders at order 100 and
		// route segments/markers at 300/400 — an unordered marker layer
		// would sort by tree position and land below the map tiles.
		<ReindexScope order={500}>
			<LayerMarker>
				<Marker
					position={[gnssPosition.lng, gnssPosition.lat]}
					paint={paint}
					onError={(err) => logError('gnss/GnssCenterMarker.onError', err)}
				/>
			</LayerMarker>
		</ReindexScope>
	);
};

export default GnssCenterMarker;
