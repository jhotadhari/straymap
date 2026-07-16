/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagTemp } from '../../selectors';
import { featureRegistry } from '../../../FeatureRegistry';
import { setTagTemp } from '../../slice';

const RowNotes: FC = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const tagTemp = useAppSelector(selectTagTemp);
	const { tag } = useContext(TagEditModalContext);

	const isSystemTag = tag?.label
		? featureRegistry.getSystemTagLabels().includes(tag.label)
		: false;

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (tagTemp) {
				dispatch(setTagTemp({ ...tagTemp, notes: newVal || null }));
			}
		},
		[dispatch, tagTemp]
	);

	const hintKey = isSystemTag ? `lines.hintSystemTagNote.${tag!.label}` : null;

	return (
		<InfoLabelRow
			label={t('lines.columns.notes')}
			style={{ alignItems: 'flex-start' }}
		>
			{isSystemTag ? (
				<Text
					style={{
						opacity: 0.7,
					}}
				>
					{hintKey ? t(hintKey) : (tag?.notes ?? '')}
				</Text>
			) : (
				<TextInput
					underlineColor="transparent"
					dense
					multiline
					numberOfLines={3}
					onChangeText={handleChangeText}
					value={tagTemp?.notes ?? tag?.notes ?? ''}
				/>
			)}
		</InfoLabelRow>
	);
};

export default RowNotes;
