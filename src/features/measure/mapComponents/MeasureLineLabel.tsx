/**
 * External dependencies
 */
import React, { FC, useMemo, useRef, useState } from 'react';
import { get } from 'lodash-es';
import { useTheme } from 'react-native-paper';
import { LayerLabel, ReindexScope } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectMeasurePosition } from '../selectors';
import { selectUnitPrefs } from '../../general/selectors';
import { useMapEventInterval } from '../../dashboard/hooks/useMapEventInterval';
import {
	bearingBetween,
	formatBearing,
	formatDistance,
	haversineDistance,
} from '../../../lib/formatting';

/**
 * Measure-distance label: a native label rendered into the map on the
 * connecting line, close to the viewport center. The library keeps it on
 * the line per frame (inside the line with a gap when it fits, beyond
 * the center when the line is too short, hidden when the target is
 * within ~5dp of the center) — perfectly aligned with the native line.
 *
 * The text (distance in the preferred unit + bearing) is recomputed at
 * the map-update interval in JS, string-deduped; the native side only
 * re-rasterizes the label bitmap when the text actually changes.
 */
const MeasureLineLabel: FC = () => {
	const position = useAppSelector(selectMeasurePosition);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const theme = useTheme();

	const positionRef = useRef(position);
	positionRef.current = position;

	const [labelText, setLabelText] = useState<string | null>(null);

	// Recompute the label while the map center moves (string-deduped).
	useMapEventInterval((event) => {
		const pos = positionRef.current;
		const center = event?.center;
		if (!pos || !center || center.length < 2) {
			setLabelText((prev) => (prev === null ? prev : null));
			return;
		}
		const dist = haversineDistance([center[0], center[1]], [pos.lng, pos.lat]);
		const text = `${formatDistance(dist, get(unitPrefs, ['distance']))}\n${formatBearing(bearingBetween([pos.lng, pos.lat], [center[0], center[1]]))}`;
		setLabelText((prev) => (prev === text ? prev : text));
	});

	const paint = useMemo(
		() => ({
			fontSize: 12,
			textColor: theme.colors.onSurface as `#${string}`,
			backgroundColor: theme.colors.surface as `#${string}`,
			borderRadius: 6,
			paddingHorizontal: 8,
			paddingVertical: 3,
			fontStyle: 'BOLD' as const,
		}),
		[theme.colors.onSurface, theme.colors.surface]
	);

	if (!position || !labelText) {
		return null;
	}

	return (
		<ReindexScope order={550}>
			<LayerLabel
				text={labelText}
				position={['50%', '50%']}
				followPosition={[position.lng, position.lat]}
				paint={paint}
			/>
		</ReindexScope>
	);
};

export default MeasureLineLabel;
