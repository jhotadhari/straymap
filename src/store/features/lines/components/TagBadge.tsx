/**
 * External dependencies
 */
import { FC } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { Tag } from '../types';

const TagBadge: FC<{
	tag: Tag;
}> = ({ tag }) => {
	return (
		<View>
			<Text>{'???tag'}</Text>
		</View>
	);
};

export default TagBadge;
