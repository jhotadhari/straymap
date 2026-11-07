/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */

/**
 * Wraps children in a View that measures its own laid-out width and
 * never shrinks below the widest width ever measured — text whose
 * content changes in digit count keeps a stable frame instead of
 * jumping around.  Per-instance state, grows only, never resets.
 */
const MeasuredWidthView: FC<{ children?: ReactNode; style?: StyleProp<ViewStyle> }> = ({
	children,
	style,
}) => {
	const [measuredMaxWidth, setMeasuredMaxWidth] = useState(0);

	// Functional update — the callback identity stays stable across
	// widens, so the View doesn't re-register its layout listener.
	// RN can deliver onLayout with a null nativeEvent during view
	// teardown (modal close / list churn) — guard before reading.
	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const layout = event?.nativeEvent?.layout;
		if (!layout) {
			return;
		}
		setMeasuredMaxWidth((prev) => {
			const width = layout.width;
			return width > prev ? width : prev;
		});
	}, []);

	return (
		<View
			// Android may skip onLayout on collapsable views.
			collapsable={false}
			style={[style, { minWidth: measuredMaxWidth }]}
			onLayout={onLayout}
		>
			{children}
		</View>
	);
};

export default MeasuredWidthView;
