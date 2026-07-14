/**
 * External dependencies
 */
import React, { FC } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DatabaseFileList from '../components/DatabaseFileList/DatabaseFileList';

const SettingsDatabase: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<ScrollView style={style}>
			<DatabaseFileList />
		</ScrollView>
	);
};
;

export default SettingsDatabase;
