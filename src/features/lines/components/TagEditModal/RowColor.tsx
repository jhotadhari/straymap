/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagTemp } from '../../selectors';
import { setTagTemp } from '../../slice';
import { getTagColor } from '../tagColor';
import ColorPaletteInline from '../../../../components/generic/controls/ColorPaletteInline';

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
		<InfoLabelRow label={t('lines.columns.color')}>
			<ColorPaletteInline
				selectedColor={currentColor}
				onSelect={handleSelect}
				style={{ width: '84%' }}
			/>
		</InfoLabelRow>
	);
};

export default RowColor;
