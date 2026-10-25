/**
 * External dependencies
 */
import { FC, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ColorRamp } from 'react-native-mapsforge-vtm-ext-path-color-ramp';

/**
 * Internal dependencies
 */
import ColorRampGradient from '../ColorRampGradient';

/**
 * Vertical colour-ramp legend rendered inside the line-list colour
 * column — a full-size ColorRampGradient filling its parent.
 */
const ColorRampColumn: FC<{
	ramp: ColorRamp;
}> = memo(({ ramp }) => {
	if (!ramp?.stops || ramp.stops.length < 2) {
		return <View style={styles.empty} />;
	}
	return <ColorRampGradient ramp={ramp} />;
});

const styles = StyleSheet.create({
	empty: {
		flex: 1,
	},
});

export default ColorRampColumn;
