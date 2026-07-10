/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import TagsTable from '../components/TagsTable';

const TagEditPage: FC<{ style?: ViewStyle }> = ({ style }) => {
	return (
		<View style={style}>
			<TagsTable />
		</View>
	);
};

export default TagEditPage;
