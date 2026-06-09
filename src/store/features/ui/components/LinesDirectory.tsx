/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import LinesList from '../../lines/components/LinesList';

const LinesDirectory: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View style={style}>
			<LinesList />
		</View>
	);
};

export default LinesDirectory;
