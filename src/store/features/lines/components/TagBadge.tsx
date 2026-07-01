/**
 * External dependencies
 */
import { FC } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

/**
import { useTranslation } from 'react-i18next';
 * Internal dependencies
 */
import { Tag } from '../types';

const TagBadge: FC<{
	tag: Tag;
}> = ({ tag }) => {
	return (
		<View>
			<Text>{tag.label}</Text>
		</View>
	);
};

export default TagBadge;
