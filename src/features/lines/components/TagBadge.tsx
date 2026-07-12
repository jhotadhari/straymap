/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectTagBadgeMode } from '../selectors';
import { getTagColor } from './tagColor';

const TagBadge: FC<{
	tag: { id: number; label: string | null; data?: any };
}> = ({ tag }) => {
	const badgeMode = useAppSelector(selectTagBadgeMode);

	// eslint-disable-next-line react-hooks/exhaustive-deps -- tracking id+data+label is sufficient; getTagColor only reads those fields
	const color = useMemo(
		() => getTagColor(tag),
		[
			tag.id,
			tag.data,
			tag.label,
		]
	);

	const isOutlined = badgeMode === 'outlined';

	return (
		<View
			style={[
				styles.badge,
				{
					backgroundColor: isOutlined ? 'transparent' : color.bg,
					borderColor: isOutlined ? color.bg : color.border,
				},
			]}
		>
			<Text
				style={[
					styles.label,
					isOutlined ? undefined : { color: color.fg },
				]}
			>
				{tag.label ?? ''}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginHorizontal: 2,
		marginVertical: 2,
		alignSelf: 'flex-start',
	},
	label: {
		fontSize: 11,
		fontWeight: '600',
	},
});

export default TagBadge;
