/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ListItemMenuControl from '../../../../components/generic/controls/ListItemMenuControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagBadgeMode } from '../../selectors';
import { setTagBadgeMode } from '../../slice';

const TagBadgeModeControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const tagBadgeMode = useAppSelector(selectTagBadgeMode);
	const handleChange = useCallback(
		(newMode: string) => dispatch(setTagBadgeMode(newMode as 'outlined' | 'contained')),
		[dispatch]
	);

	const options = useMemo(
		() => [
			{ key: 'contained', label: 'lines.tagBadgeModeContained' },
			{ key: 'outlined', label: 'lines.tagBadgeModeOutlined' },
		],
		[]
	);

	return (
		<ListItemMenuControl
			anchorLabel={t('lines.tagBadgeMode')}
			options={options}
			setValue={handleChange}
			value={tagBadgeMode}
			anchorIcon={({ color }) => (
				<Icon
					source="tag-outline"
					color={color}
					size={25}
				/>
			)}
		/>
	);
};

export default TagBadgeModeControl;
