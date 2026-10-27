/**
 * External dependencies
 */
import React, { memo, useContext, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { MapPositionSharedValues, toScreenPosition } from 'react-native-mapsforge-vtm/reanimated';

/**
 * Internal dependencies
 */
import { AppContext, MapContext } from '../../Context';
import useBottomDrawerAwareHeights from '../../features/drawers/hooks/useBottomDrawerAwareHeights';

const LINE_WIDTH = 2;
/** Default label distance beyond the map center. */
const DEFAULT_LABEL_OFFSET_DP = 48;

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

const AnimatedLine = Animated.createAnimatedComponent(Line);

const CenterConnectionLine = ({
	sharedValues,
	targetSv,
	showSv,
	color,
}: {
	sharedValues: OverlaySharedValues;
	targetSv: SharedValue<{ lat: number; lng: number } | null>;
	showSv: SharedValue<boolean>;
	color: string;
}) => {
	const { centerSv, viewportWidthSv, viewportHeightSv, zoomSv, bearingSv, tiltSv } = sharedValues;

	const animatedProps = useAnimatedProps(() => {
		const target = targetSv.value;
		const vpW = viewportWidthSv.value;
		const vpH = viewportHeightSv.value;
		if (!target || !showSv.value || vpW <= 0 || vpH <= 0) {
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
				stroke={color}
				strokeWidth={LINE_WIDTH}
				strokeLinecap="round"
			/>
		</Svg>
	);
};

const CenterConnectionLabel = ({
	sharedValues,
	targetSv,
	showSv,
	labelText,
	labelOffsetDp,
	labelBgColor,
	labelTextColor,
}: {
	sharedValues: OverlaySharedValues;
	targetSv: SharedValue<{ lat: number; lng: number } | null>;
	showSv: SharedValue<boolean>;
	labelText: string | null;
	labelOffsetDp: number;
	labelBgColor: string;
	labelTextColor: string;
}) => {
	const { centerSv, viewportWidthSv, viewportHeightSv, zoomSv, bearingSv, tiltSv } = sharedValues;

	const animatedStyle = useAnimatedStyle(() => {
		const target = targetSv.value;
		const vpW = viewportWidthSv.value;
		const vpH = viewportHeightSv.value;
		if (!target || !showSv.value || vpW <= 0 || vpH <= 0) {
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
		// Beyond the map center, along the target→center direction.
		return {
			opacity: 1,
			left: cx + dx * labelOffsetDp,
			top: cy + dy * labelOffsetDp,
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
 * Shared map overlay: a thin line from the viewport center to a moving
 * geo target plus a label anchored just beyond the map center, all
 * derived on the UI thread at 60fps with zero bridge crossings.
 *
 * Consumed by features (gnss center mode, measure distance) that connect
 * the map center to a geo position; each feature owns its `targetSv` /
 * `showSv` shared values and the label text.
 */
const CenterConnectionOverlay = ({
	targetSv,
	showSv,
	labelText,
	lineColor = '#000000',
	labelOffsetDp = DEFAULT_LABEL_OFFSET_DP,
}: {
	targetSv: SharedValue<{ lat: number; lng: number } | null>;
	showSv: SharedValue<boolean>;
	labelText: string | null;
	lineColor?: string;
	labelOffsetDp?: number;
}) => {
	const theme = useTheme();

	const { mapHeight } = useContext(AppContext);
	const { mapPositionSvRef } = useContext(MapContext);
	const { width } = useMemo(() => Dimensions.get('window'), []);
	const { animatedHeight } = useBottomDrawerAwareHeights(mapHeight);

	const mapPosition = mapPositionSvRef.current;
	if (!mapPosition) {
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
			<CenterConnectionLine
				sharedValues={mapPosition}
				targetSv={targetSv}
				showSv={showSv}
				color={lineColor}
			/>
			<CenterConnectionLabel
				sharedValues={mapPosition}
				targetSv={targetSv}
				showSv={showSv}
				labelText={labelText}
				labelOffsetDp={labelOffsetDp}
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

export default memo(CenterConnectionOverlay);
