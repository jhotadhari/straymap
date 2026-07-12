/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DatePickerInput } from 'react-native-paper-dates';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import ButtonHighlight from '../../../../../../components/generic/ButtonHighlight';
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
import { sharedStyles as appSharedStyles } from '../../../../../../sharedStyles';
import { sharedStyles } from '../sharedDeps';
import { DateColumnFilter } from '../../../types';

const dateToString = (d: Date | undefined): string | undefined => {
	if (!d) {
		return undefined;
	}
	return dayjs(d).format('YYYY-MM-DD');
};

const stringToDate = (s: string | undefined): Date | undefined => {
	if (!s) {
		return undefined;
	}
	const parsed = dayjs(s, 'YYYY-MM-DD');
	return parsed.isValid() ? parsed.toDate() : undefined;
};

const FilterDateModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: DateColumnFilter;
	onDismiss: () => void;
	onSave: (filter: DateColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t, i18n } = useTranslation();

	const [minDate, setMinDate] = useState<Date | undefined>(stringToDate(existingFilter?.min));
	const [maxDate, setMaxDate] = useState<Date | undefined>(stringToDate(existingFilter?.max));

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			const minStr = dateToString(minDate);
			const maxStr = dateToString(maxDate);
			// Save when values are non-empty, OR when editing an existing
			// filter (allows clearing by dismissing with empty inputs).
			if (minStr !== undefined || maxStr !== undefined || existingFilter) {
				onSave({
					type: 'date',
					columnKey,
					min: minStr,
					max: maxStr,
				});
			}
		};
	}, [
		columnKey,
		minDate,
		maxDate,
		onSave,
		existingFilter,
	]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setMinDate(stringToDate(existingFilter?.min));
			setMaxDate(stringToDate(existingFilter?.max));
		}
	}, [visible, existingFilter]);

	const handleDismiss = useCallback(() => {
		saveRef.current?.();
		onDismiss();
	}, [onDismiss]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const locale = useMemo(() => (i18n.language === 'de' ? 'de' : 'en'), [i18n.language]);

	const { width } = Dimensions.get('window');
	const inputWidth = useMemo(() => width * 0.45, [width]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<InfoRowControl
				label={t('lines.filterMin')}
				Info={t('lines.hintDateFilter')}
			>
				<DatePickerInput
					locale={locale}
					value={minDate}
					onChange={setMinDate}
					inputMode="start"
					label={''}
					mode="outlined"
					withDateFormatInLabel={true}
					style={{ width: inputWidth }}
				/>
			</InfoRowControl>

			<InfoRowControl
				label={t('lines.filterMax')}
				Info={t('lines.hintDateFilter')}
			>
				<DatePickerInput
					locale={locale}
					value={maxDate}
					onChange={setMaxDate}
					inputMode="end"
					label={''}
					mode="outlined"
					withDateFormatInLabel={true}
					style={{ width: inputWidth }}
				/>
			</InfoRowControl>

			{onDelete && (
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDelete}
						mode="contained"
						buttonColor={theme.colors.errorContainer}
						textColor={theme.colors.onErrorContainer}
					>
						<Text>{t('lines.removeFilter')}</Text>
					</ButtonHighlight>
				</View>
			)}
		</ModalWrapper>
	);
};

export default FilterDateModal;
