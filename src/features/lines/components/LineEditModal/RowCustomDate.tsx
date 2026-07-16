/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DatePickerInput } from 'react-native-paper-dates';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { LinePartial } from '../../types';

const dateToString = (d: Date | undefined): string | undefined => {
	if (!d) {
		return undefined;
	}
	return dayjs(d).format('YYYY-MM-DD');
};

const stringToDate = (s: string | undefined | null): Date | undefined => {
	if (!s) {
		return undefined;
	}
	const parsed = dayjs(s, 'YYYY-MM-DD');
	return parsed.isValid() ? parsed.toDate() : undefined;
};

const RowCustomDate: FC = () => {
	const dispatch = useAppDispatch();

	const lineTemp = useAppSelector(selectLineTemp);

	const { t, i18n } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const currentValue =
		lineTemp && 'custom_date' in lineTemp ? lineTemp.custom_date : line?.custom_date;

	const handleChange = useCallback(
		(d: Date | undefined) => {
			if (lineTemp) {
				dispatch(
					setLineTemp({
						...(lineTemp as LinePartial),
						custom_date: dateToString(d) ?? null,
					})
				);
			}
		},
		[dispatch, lineTemp]
	);

	const locale = useMemo(() => (i18n.language === 'de' ? 'de' : 'en'), [i18n.language]);

	return (
		<InfoLabelRow
			label={t('lines.columns.custom_date')}
			Info={t('lines.hintCustomDate')}
		>
			<DatePickerInput
				locale={locale}
				value={stringToDate(currentValue)}
				onChange={handleChange}
				inputMode="start"
				label={''}
				mode="outlined"
				withDateFormatInLabel={true}
				style={{ flex: 1 }}
			/>
		</InfoLabelRow>
	);
};

export default RowCustomDate;
