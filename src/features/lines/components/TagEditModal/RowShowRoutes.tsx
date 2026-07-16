/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TagEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch } from '../../../../store/hooks';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { setLinesFilters, setLinesFilterLogic, setTagTemp } from '../../slice';
import { addUiItemKey } from '../../../ui/slice';
import { sharedStyles } from './sharedDeps';

const RowShowRoutes: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const { tag } = useContext(TagEditModalContext);

	const handlePress = useCallback(() => {
		if (!tag?.label) return;

		dispatch(
			setLinesFilters([
				{
					type: 'tags' as const,
					columnKey: 'tags',
					operator: 'has' as const,
					value: tag.label,
				},
			])
		);
		dispatch(setLinesFilterLogic('and'));
		dispatch(setTagTemp(null));
		dispatch(addUiItemKey('linesBrowser'));
	}, [dispatch, tag]);

	const disabled = !tag?.label;

	return (
		<InfoLabelRow
			label={t('lines.showRoutes')}
			Info={t('lines.showRoutesWithTagHint')}
		>
			<ButtonHighlight
				mode="outlined"
				compact
				disabled={disabled}
				onPress={handlePress}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				<Text>{t('lines.showRoutesWithTag')}</Text>
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowShowRoutes;
