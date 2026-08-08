/**
 * External dependencies
 */
import { FC, memo, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from '../../../../lib/dayjs';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import DateTimePickerControl from '../../../../components/generic/controls/DateTimePickerControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineTemp } from '../../selectors';
import { setLineTemp } from '../../slice';
import { selectDateTimeFormat } from '../../../general/selectors';

const stringToDate = (s: string | undefined | null): Date | undefined => {
	if (!s) {
		return undefined;
	}
	const parsed = dayjs(s);
	return parsed.isValid() ? parsed.toDate() : undefined;
};

const RowCustomDate: FC = () => {
	const dispatch = useAppDispatch();

	const lineTemp = useAppSelector(selectLineTemp);
	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const { t, i18n } = useTranslation();

	const { line } = useContext(LineEditModalContext);

	const currentValue =
		lineTemp && 'custom_date' in lineTemp ? lineTemp.custom_date : line?.custom_date;

	const currentDate = useMemo(
		() => stringToDate(currentValue),
		[currentValue]
	);

	const handleChange = useCallback(
		(d: Date) => {
			if (lineTemp) {
				dispatch(
					setLineTemp({
						...lineTemp,
						custom_date: dayjs(d).toISOString(),
					})
				);
			}
		},
		[dispatch, lineTemp]
	);

	const locale = useMemo(() => i18n.language, [i18n.language]);

	return (
		<DateTimePickerControl
			value={currentDate}
			onUpdate={handleChange}
			format={dateTimeFormat}
			locale={locale}
			label={t('lines.columns.custom_date')}
			Info={t('lines.hintCustomDate')}
		/>
	);
};

export default memo(RowCustomDate);
