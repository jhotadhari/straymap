/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import LinesTable from '../../lines/components/LinesTable/LinesTable';

const LinesBrowser: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View style={style}>
			<LinesTable />
		</View>
	);
};

export default LinesBrowser;
