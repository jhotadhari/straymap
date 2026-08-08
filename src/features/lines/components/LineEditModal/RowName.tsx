/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { LinePartial } from '../../types';
import { sharedStyles } from '../../../../sharedStyles';

const RowName: FC = () => {
	const dispatch = useAppDispatch();

	const lineTemp = useAppSelector(selectLineTemp);

	const theme = useTheme();
	const { t } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (lineTemp) {
				dispatch(
					setLineTemp({
						...(lineTemp as LinePartial),
						title: newVal,
					})
				);
			}
		},
		[dispatch, lineTemp]
	);

	const inputTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	return (
		<InfoLabelRow
			label={t('lines.name')}
			Info={t('lines.hintName')}
			style={sharedStyles.alignStart}
		>
			<TextInput
				multiline={true}
				numberOfLines={3}
				underlineColor="transparent"
				dense={true}
				theme={inputTheme}
				onChangeText={handleChangeText}
				value={lineTemp?.title ?? line?.title ?? ''}
			/>
		</InfoLabelRow>
	);
};

export default RowName;
