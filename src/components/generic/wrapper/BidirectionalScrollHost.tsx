/**
 * External dependencies
 */
import React from 'react';
import { LayoutChangeEvent, requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

type NativeProps = {
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
	onLayout?: (event: LayoutChangeEvent) => void;
};

export default requireNativeComponent<NativeProps>('BidirectionalScrollHost');
