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
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagTemp } from '../../selectors';
import { setTagTemp } from '../../slice';
import { featureRegistry } from '../../../FeatureRegistry';

const RowLabel: FC = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const tagTemp = useAppSelector(selectTagTemp);
	const { tag } = useContext(TagEditModalContext);

	const isSystemTag = tag
		? featureRegistry.getSystemTagLabels().includes(tag.label ?? '')
		: false;

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (tagTemp) {
				dispatch(setTagTemp({ ...tagTemp, label: newVal }));
			}
		},
		[dispatch, tagTemp]
	);

	return (
		<InfoLabelRow
			label={t('lines.name')}
			style={{ alignItems: 'flex-start' }}
		>
			<TextInput
				underlineColor="transparent"
				dense
				disabled={isSystemTag}
				onChangeText={handleChangeText}
				value={tagTemp?.label ?? tag?.label ?? ''}
			/>
		</InfoLabelRow>
	);
};

export default RowLabel;
