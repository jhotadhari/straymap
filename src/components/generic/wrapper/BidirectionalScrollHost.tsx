/**
 * External dependencies
 */
import React from 'react';
import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';

type NativeProps = {
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
};

export default requireNativeComponent<NativeProps>('BidirectionalScrollHost');
