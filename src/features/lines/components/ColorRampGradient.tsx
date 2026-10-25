/**
 * External dependencies
 */
import { FC, memo, useMemo, useRef } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ColorRamp } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Vertical colour-ramp gradient bar (SVG). Stop offsets are computed in
 * the ramp's effective value domain — percent stops are converted to
 * degrees first, mirroring usePathColorRamp's stopsToDegrees — before
 * normalizing to 0-1. Size via `style` (defaults to filling its parent).
 */
const percentToDeg = (pct: number) => (Math.atan(pct / 100) * 180) / Math.PI;

const getStopOffsets = (ramp: ColorRamp): number[] => {
	const values = ramp.stops.map((stop) =>
		ramp.unit === 'percent' ? percentToDeg(stop.value) : stop.value
	);
	const min = values[0] ?? 0;
	const max = values[values.length - 1] ?? min;
	const range = max - min;
	return values.map((value) => (!isFinite(range) || range === 0 ? 0 : (value - min) / range));
};

const ColorRampGradient: FC<{
	ramp: ColorRamp;
	style?: StyleProp<ViewStyle>;
}> = memo(({ ramp, style }) => {
	const gradientId = useRef(`colorRamp-${Math.random().toString(36).slice(2, 8)}`).current;

	const stops = useMemo(() => {
		if (!ramp?.stops || ramp.stops.length < 2) {
			return null;
		}
		const offsets = getStopOffsets(ramp);
		return ramp.stops.map((stop, index) => ({
			offset: offsets[index] ?? 0,
			color: stop.color,
		}));
	}, [ramp]);

	if (!stops) {
		return null;
	}

	return (
		<Svg style={[styles.svg, style]}>
			<Defs>
				<LinearGradient
					id={gradientId}
					x1="0"
					y1="0"
					x2="0"
					y2="1"
				>
					{stops.map((stop, index) => (
						<Stop
							key={index}
							offset={stop.offset}
							stopColor={stop.color}
							stopOpacity="1"
						/>
					))}
				</LinearGradient>
			</Defs>
			<Rect
				x="0"
				y="0"
				width="100%"
				height="100%"
				fill={`url(#${gradientId})`}
			/>
		</Svg>
	);
});

const styles = StyleSheet.create({
	svg: {
		width: '100%',
		height: '100%',
	},
});

export default ColorRampGradient;
