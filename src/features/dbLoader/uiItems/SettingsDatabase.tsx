/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import DatabaseFileList from '../components/DatabaseFileList/DatabaseFileList';
import useKeyboardShown from '../../../compose/useKeyboardShown';

const SettingsDatabase: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { keyboardHeight } = useKeyboardShown();

	const containerPadding = useMemo(
		() => (keyboardHeight ? { paddingBottom: keyboardHeight } : undefined),
		[keyboardHeight]
	);

	return (
		<ScrollView style={style} contentContainerStyle={containerPadding}>
			<DatabaseFileList />
		</ScrollView>
	);
};
export default SettingsDatabase;
