/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectTagTemp } from '../../selectors';
import { setTagTemp } from '../../slice';
import { getTagColor } from '../tagColor';
import ColorPaletteInline from '../TagsTable/ColorPaletteInline';

const RowColor: FC = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const tagTemp = useAppSelector(selectTagTemp);
	const { tag } = useContext(TagEditModalContext);

	const currentColor = useMemo(
		() =>
			getTagColor({ label: tagTemp?.label ?? tag?.label, data: tagTemp?.data ?? tag?.data })
				.bg,
		[tagTemp, tag]
	);

	const handleSelect = useCallback(
		(color: string) => {
			if (tagTemp) {
				dispatch(setTagTemp({ ...tagTemp, data: { ...(tagTemp.data ?? {}), color } }));
			}
		},
		[dispatch, tagTemp]
	);

	return (
		<InfoRowControl label={t('lines.columns.color')}>
			<ColorPaletteInline
				selectedColor={currentColor}
				onSelect={handleSelect}
			/>
		</InfoRowControl>
	);
};

export default RowColor;
