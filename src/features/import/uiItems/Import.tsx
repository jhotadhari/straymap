/**
 * Internal dependencies
 */
import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import ImportPage from '../components/ImportPage';

const LinesImport: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View style={style}>
			<ImportPage />
		</View>
	);
};

export default memo(LinesImport);
