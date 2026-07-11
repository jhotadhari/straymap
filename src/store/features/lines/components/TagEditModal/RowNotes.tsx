/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectTagTemp } from '../../selectors';
import { setTagTemp } from '../../slice';

const RowNotes: FC = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const tagTemp = useAppSelector(selectTagTemp);
	const { tag } = useContext(TagEditModalContext);

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (tagTemp) {
				dispatch(setTagTemp({ ...tagTemp, notes: newVal || null }));
			}
		},
		[dispatch, tagTemp]
	);

	return (
		<InfoRowControl
			label={t('lines.columns.notes')}
			style={{ alignItems: 'flex-start' }}
		>
			<TextInput
				style={{
					flexGrow: 1,
					maxWidth: '83%',
				}}
				underlineColor="transparent"
				dense
				multiline
				numberOfLines={3}
				onChangeText={handleChangeText}
				value={tagTemp?.notes ?? tag?.notes ?? ''}
			/>
		</InfoRowControl>
	);
};

export default RowNotes;
