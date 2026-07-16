/**
 * External dependencies
 */
import { FC, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectTagBadgeMode } from '../selectors';
import { getTagColor } from './tagColor';
import Badge from '../../../components/generic/primitives/Badge';

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

	return (
		<Badge
			badgeMode={badgeMode}
			color={color}
			label={tag?.label}
		/>
	);
};

export default TagBadge;
