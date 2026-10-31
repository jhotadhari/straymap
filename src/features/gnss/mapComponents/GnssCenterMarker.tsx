/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useState } from 'react';
import { PixelRatio } from 'react-native';
import { get } from 'lodash-es';
import RNFS from 'react-native-fs';
import { LayerMarker, LayerShape, Marker, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import {
	selectAccuracyCircleThresholdMeters,
	selectDeviceAzimuth,
	selectGnssHeading,
	selectGnssPosition,
	selectIsActive,
	selectMarkerColor,
	selectMarkerDirection,
	selectMarkerIconSource,
	selectMarkerSize,
} from '../selectors';
import { selectAppDirs } from '../../dirs/selectors';
import { buildMarkerSvg } from '../markerSvg';
import { logError } from '../../../lib/utils';

const MARKER_FILE_NAME = 'gnssCenterMarker.svg';

const isFileSource = (iconSource: string) =>
	iconSource.startsWith('/') || iconSource.startsWith('content://');

/**
 * GNSS position marker, rendered as a NATIVE marker so it is drawn by
 * the map itself every render frame — unlike the reanimated overlays, it
 * cannot lag behind the map content during fast pans.
 *
 * Visible whenever GNSS is active (independent of center mode — center
 * mode only controls the map re-centering and the panned-away line).
 *
 * The configured icon (triangle preset or a custom svg/png file) is
 * decoded natively via the marker's filePath paint; the rotation
 * (movement direction, or the device compass azimuth when the marker
 * direction is 'north') is applied natively via the `rotation` paint
 * option (whole degrees).
 *
 * While the GNSS accuracy is worse than the configured threshold, a
 * native circle with the live accuracy radius is drawn under the marker.
 */
const GnssCenterMarker: FC = () => {
	const isActive = useAppSelector(selectIsActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const gnssHeading = useAppSelector(selectGnssHeading);
	const markerIconSource = useAppSelector(selectMarkerIconSource);
	const markerSize = useAppSelector(selectMarkerSize);
	const markerColor = useAppSelector(selectMarkerColor);
	const markerDirection = useAppSelector(selectMarkerDirection);
	const deviceAzimuth = useAppSelector(selectDeviceAzimuth);
	const accuracyCircleThresholdMeters = useAppSelector(selectAccuracyCircleThresholdMeters);
	const appDirs = useAppSelector(selectAppDirs);

	const markerDir = get(appDirs, ['marker', 0]) as string | undefined;

	const [filePath, setFilePath] = useState<string | null>(null);

	// Custom file sources are used as-is; the triangle preset is written
	// into the app's marker dir (native decodes .svg filePaths directly).
	useEffect(() => {
		if (isFileSource(markerIconSource)) {
			setFilePath(markerIconSource);
			return;
		}
		if (!markerDir) {
			return;
		}
		const path = `${markerDir}/${MARKER_FILE_NAME}`;
		let cancelled = false;
		(async () => {
			try {
				await RNFS.writeFile(path, buildMarkerSvg(markerSize, markerColor), 'utf8');
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
	}, [
		markerDir,
		markerIconSource,
		markerSize,
		markerColor,
	]);

	// The native marker canvas is raw pixels — scale dp by density.
	const sizePx = useMemo(() => Math.round(markerSize * PixelRatio.get()), [markerSize]);

	// Movement direction from consecutive fixes (slice-derived heading) —
	// the payload's velocity bearing is unreliable for pedestrian fixes.
	// In 'north' mode the marker turns with the device compass (azimuth
	// relative to magnetic north); without a compass sensor it stays
	// pointing to map north (rotation 0).
	const rotation =
		markerDirection === 'north' ? deviceAzimuth ?? 0 : gnssHeading ?? 0;

	const paint = useMemo(
		() =>
			filePath
				? {
						width: sizePx,
						height: sizePx,
						filePath: filePath as `/${string}` | `content://${string}`,
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

	// Accuracy circle: radius = live accuracy; only drawn while the
	// accuracy is worse than the configured threshold (0 disables it).
	const showAccuracyCircle =
		accuracyCircleThresholdMeters > 0 &&
		gnssPosition !== null &&
		gnssPosition.accuracy > accuracyCircleThresholdMeters;

	if (!isActive || !gnssPosition || !paint) {
		return null;
	}

	return (
		<>
			{/* Explicit scope order: the base map layer renders at order 100
				and route segments/markers at 300/400 — an unordered marker
				layer would sort by tree position and land below the map
				tiles. The accuracy circle sits one step below the marker. */}
			{showAccuracyCircle && (
				<ReindexScope order={490}>
					<LayerShape
						shape={{
							type: 'circle',
							center: [gnssPosition.lng, gnssPosition.lat],
							radiusKm: gnssPosition.accuracy / 1000,
						}}
						paint={{
							strokeColor: markerColor as `#${string}`,
							strokeWidth: 1,
							fillColor: markerColor as `#${string}`,
							fillAlpha: 0.15,
						}}
						onError={(err) => logError('gnss/GnssCenterMarker.circle', err)}
					/>
				</ReindexScope>
			)}

			<ReindexScope order={500}>
				<LayerMarker>
					<Marker
						position={[gnssPosition.lng, gnssPosition.lat]}
						paint={paint}
						onError={(err) => logError('gnss/GnssCenterMarker.onError', err)}
					/>
				</LayerMarker>
			</ReindexScope>
		</>
	);
};

export default GnssCenterMarker;
