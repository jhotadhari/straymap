/**
 * Internal dependencies
 */
import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';
import ImportPage from '../components/Import/ImportPage';

const LinesImport: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View style={style}>
			<ImportPage />
		</View>
	);
};

export default LinesImport;
