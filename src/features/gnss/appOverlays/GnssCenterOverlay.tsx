/**
 * External dependencies
 */
import React, { memo, useContext, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
	SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';
import { MapPositionSharedValues, toScreenPosition } from 'react-native-mapsforge-vtm/reanimated';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectGnssPosition, selectIsCenterActive } from '../selectors';
import { useGnssCenterMode } from '../hooks/useGnssCenterMode';
import { AppContext, MapContext } from '../../../Context';
import useBottomDrawerAwareHeights from '../../drawers/hooks/useBottomDrawerAwareHeights';
import { RECORDED_LINE_COLOR } from '../../lines/db/actionsTag';

const TRIANGLE_WIDTH = 14;
const TRIANGLE_HEIGHT = 26;
const LINE_WIDTH = 2;
/** Label distance beyond the map center, along the GNSS→center direction. */
const LABEL_OFFSET_DP = 48;

type OverlaySharedValues = Pick<
	MapPositionSharedValues,
	'centerSv' | 'zoomSv' | 'bearingSv' | 'tiltSv' | 'viewportWidthSv' | 'viewportHeightSv'
>;

/**
 * Clips the segment (x1,y1)→(x2,y2) to the rect and returns the endpoint
 * of the clipped far end. (x1,y1) is expected to lie inside the rect —
 * here that is always the viewport center.
 */
function clipSegmentToRect(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	minX: number,
	minY: number,
	maxX: number,
	maxY: number
): { x: number; y: number } | null {
	'worklet';
	let t0 = 0;
	let t1 = 1;
	const dx = x2 - x1;
	const dy = y2 - y1;
	const p = [
		-dx,
		dx,
		-dy,
		dy,
	];
	const q = [
		x1 - minX,
		maxX - x1,
		y1 - minY,
		maxY - y1,
	];
	for (let i = 0; i < 4; i++) {
		if (p[i] === 0) {
			if (q[i] < 0) {
				return null;
			}
		} else {
			const t = q[i] / p[i];
			if (p[i] < 0) {
				if (t > t1) {
					return null;
				}
				if (t > t0) {
					t0 = t;
				}
			} else {
				if (t < t0) {
					return null;
				}
				if (t < t1) {
					t1 = t;
				}
			}
		}
	}
	return { x: x1 + t1 * dx, y: y1 + t1 * dy };
}

const GnssCenterTriangle = ({
	sharedValues,
	gnssTargetSv,
	gnssBearingSv,
}: {
	sharedValues: OverlaySharedValues;
	gnssTargetSv: SharedValue<{ lat: number; lng: number } | null>;
	gnssBearingSv: SharedValue<number>;
}) => {
	const { centerSv, viewportWidthSv, viewportHeightSv, zoomSv, bearingSv, tiltSv } = sharedValues;

	const animatedStyle = useAnimatedStyle(() => {
		const target = gnssTargetSv.value;
		if (!target) {
			return { opacity: 0 };
		}
		const screenPos = toScreenPosition(
			centerSv,
			viewportWidthSv,
			viewportHeightSv,
			zoomSv,
			bearingSv,
			tiltSv,
			target
		);
		if (!screenPos) {
			return { opacity: 0 };
		}
		return {
			opacity: 1,
			left: screenPos.x,
			top: screenPos.y,
			transform: [
				{ translateX: -TRIANGLE_WIDTH / 2 },
				{ translateY: -TRIANGLE_HEIGHT / 2 },
				{ rotate: `${gnssBearingSv.value - bearingSv.value}deg` },
			],
		};
	});

	return (
		<Animated.View
			style={[styles.triangle, animatedStyle]}
			pointerEvents="none"
		>
			<Svg
				width={TRIANGLE_WIDTH}
				height={TRIANGLE_HEIGHT}
			>
				<Polygon
					points={`${TRIANGLE_WIDTH / 2},1 1,${TRIANGLE_HEIGHT - 1} ${TRIANGLE_WIDTH - 1},${TRIANGLE_HEIGHT - 1}`}
					fill={RECORDED_LINE_COLOR}
					stroke="#000000"
					strokeWidth={2}
				/>
			</Svg>
		</Animated.View>
	);
};

const AnimatedLine = Animated.createAnimatedComponent(Line);

const GnssCenterConnection = ({
	sharedValues,
	gnssTargetSv,
	showConnectionSv,
}: {
	sharedValues: OverlaySharedValues;
	gnssTargetSv: SharedValue<{ lat: number; lng: number } | null>;
	showConnectionSv: SharedValue<boolean>;
}) => {
	const { centerSv, viewportWidthSv, viewportHeightSv, zoomSv, bearingSv, tiltSv } = sharedValues;

	const animatedProps = useAnimatedProps(() => {
		const target = gnssTargetSv.value;
		const vpW = viewportWidthSv.value;
		const vpH = viewportHeightSv.value;
		if (!target || !showConnectionSv.value || vpW <= 0 || vpH <= 0) {
			return { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 };
		}
		const screenPos = toScreenPosition(
			centerSv,
			viewportWidthSv,
			viewportHeightSv,
			zoomSv,
			bearingSv,
			tiltSv,
			target
		);
		if (!screenPos) {
			return { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 };
		}
		const cx = vpW / 2;
		const cy = vpH / 2;
		const clipped = clipSegmentToRect(cx, cy, screenPos.x, screenPos.y, 0, 0, vpW, vpH);
		if (!clipped) {
			return { x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 };
		}
		return { x1: cx, y1: cy, x2: clipped.x, y2: clipped.y, opacity: 1 };
	});

	return (
		<Svg
			width="100%"
			height="100%"
			style={StyleSheet.absoluteFill}
			pointerEvents="none"
		>
			<AnimatedLine
				animatedProps={animatedProps}
				stroke="#000000"
				strokeWidth={LINE_WIDTH}
				strokeLinecap="round"
			/>
		</Svg>
	);
};

const GnssCenterLabel = ({
	sharedValues,
	gnssTargetSv,
	showConnectionSv,
	labelText,
	labelBgColor,
	labelTextColor,
}: {
	sharedValues: OverlaySharedValues;
	gnssTargetSv: SharedValue<{ lat: number; lng: number } | null>;
	showConnectionSv: SharedValue<boolean>;
	labelText: string | null;
	labelBgColor: string;
	labelTextColor: string;
}) => {
	const { centerSv, viewportWidthSv, viewportHeightSv, zoomSv, bearingSv, tiltSv } = sharedValues;

	const animatedStyle = useAnimatedStyle(() => {
		const target = gnssTargetSv.value;
		const vpW = viewportWidthSv.value;
		const vpH = viewportHeightSv.value;
		if (!target || !showConnectionSv.value || vpW <= 0 || vpH <= 0) {
			return { opacity: 0 };
		}
		const screenPos = toScreenPosition(
			centerSv,
			viewportWidthSv,
			viewportHeightSv,
			zoomSv,
			bearingSv,
			tiltSv,
			target
		);
		if (!screenPos) {
			return { opacity: 0 };
		}
		const cx = vpW / 2;
		const cy = vpH / 2;
		let dx = cx - screenPos.x;
		let dy = cy - screenPos.y;
		const len = Math.sqrt(dx * dx + dy * dy);
		if (len < 1) {
			return { opacity: 0 };
		}
		dx /= len;
		dy /= len;
		// Beyond the map center, along the GNSS→center direction.
		return {
			opacity: 1,
			left: cx + dx * LABEL_OFFSET_DP,
			top: cy + dy * LABEL_OFFSET_DP,
		};
	});

	if (!labelText) {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.label,
				{ backgroundColor: labelBgColor },
				animatedStyle,
			]}
			pointerEvents="none"
		>
			<Text style={[styles.labelText, { color: labelTextColor }]}>{labelText}</Text>
		</Animated.View>
	);
};

/**
 * Center-mode overlay: triangle marker on the GNSS position (rotated to
 * the direction of movement), plus — while the map is panned away from
 * the GNSS position — a thin connecting line and a distance/bearing
 * label anchored just beyond the map center. All positions are derived
 * on the UI thread at 60fps with zero bridge crossings.
 */
const GnssCenterOverlay = () => {
	const theme = useTheme();
	const isCenterActive = useAppSelector(selectIsCenterActive);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const { mode, labelText } = useGnssCenterMode();

	const { mapHeight } = useContext(AppContext);
	const { mapPositionSvRef } = useContext(MapContext);
	const { width } = useMemo(() => Dimensions.get('window'), []);
	const { animatedHeight } = useBottomDrawerAwareHeights(mapHeight);

	const gnssTargetSv = useSharedValue<{ lat: number; lng: number } | null>(null);
	const gnssBearingSv = useSharedValue(0);
	const showConnectionSv = useSharedValue(false);

	useEffect(() => {
		if (gnssPosition) {
			gnssTargetSv.value = { lat: gnssPosition.lat, lng: gnssPosition.lng };
			gnssBearingSv.value = gnssPosition.bearing;
		} else {
			gnssTargetSv.value = null;
			gnssBearingSv.value = 0;
		}
	}, [
		gnssPosition,
		gnssTargetSv,
		gnssBearingSv,
	]);

	const showConnection = mode === 'pannedAway' || mode === 'returning';
	useEffect(() => {
		showConnectionSv.value = showConnection;
	}, [showConnection, showConnectionSv]);

	const mapPosition = mapPositionSvRef.current;
	if (!isCenterActive || !mapPosition) {
		return null;
	}

	return (
		<Animated.View
			style={[
				styles.wrapper,
				{ width },
				animatedHeight,
			]}
			pointerEvents="box-none"
		>
			<GnssCenterConnection
				sharedValues={mapPosition}
				gnssTargetSv={gnssTargetSv}
				showConnectionSv={showConnectionSv}
			/>
			<GnssCenterTriangle
				sharedValues={mapPosition}
				gnssTargetSv={gnssTargetSv}
				gnssBearingSv={gnssBearingSv}
			/>
			<GnssCenterLabel
				sharedValues={mapPosition}
				gnssTargetSv={gnssTargetSv}
				showConnectionSv={showConnectionSv}
				labelText={labelText}
				labelBgColor={theme.colors.surface}
				labelTextColor={theme.colors.onSurface}
			/>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
	triangle: {
		position: 'absolute',
		left: 0,
		top: 0,
	},
	label: {
		position: 'absolute',
		left: 0,
		top: 0,
		transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
	},
	labelText: {
		fontSize: 12,
		fontWeight: 'bold',
		textAlign: 'center',
	},
});

export default memo(GnssCenterOverlay);
