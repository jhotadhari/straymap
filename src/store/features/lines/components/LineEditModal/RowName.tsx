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
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { LinePartial } from '../../types';

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
		<InfoRowControl
			label={t('lines.name')}
			Info={t('lines.hintName')}
		>
			<TextInput
				// style={{ flexGrow: 1 }}
				underlineColor="transparent"
				dense={true}
				theme={inputTheme}
				onChangeText={handleChangeText}
				value={lineTemp?.title ?? line?.title ?? ''}
			/>
		</InfoRowControl>
	);
};

export default RowName;
