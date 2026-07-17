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

	const color = useMemo(() => getTagColor(tag), [tag]);

	return (
		<Badge
			badgeMode={badgeMode}
			color={color}
			label={tag?.label}
		/>
	);
};

export default TagBadge;
