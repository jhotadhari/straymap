/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DatePickerInput } from 'react-native-paper-dates';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { DateColumnFilter, getFilterKey } from '../../types';

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
	const { t, i18n } = useTranslation();

	const buttonPropsDelete = useButtonProps({ isDestructive: true });

	const [minDate, setMinDate] = useState<Date | undefined>(stringToDate(existingFilter?.min));
	const [maxDate, setMaxDate] = useState<Date | undefined>(stringToDate(existingFilter?.max));

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
		const minStr = dateToString(minDate);
		const maxStr = dateToString(maxDate);
		const bothEmpty = minStr === undefined && maxStr === undefined;
		if (bothEmpty) {
			if (existingFilter) {
				// Clearing both bounds on an existing filter → remove it.
				onDelete?.();
			}
			// New filter with no bounds → no-op, just close.
			onDismiss();
			return;
		}
		const newFilter: DateColumnFilter = {
			type: 'date',
			columnKey,
			min: minStr,
			max: maxStr,
		};
		// If editing a filter whose key changes (e.g., adding max to
		// a min-only filter), remove the old entry so no stale entry
		// with the old key remains.
		if (existingFilter && getFilterKey(existingFilter) !== getFilterKey(newFilter)) {
			onDelete?.();
		}
		onSave(newFilter);
		onDismiss();
	}, [
		columnKey,
		minDate,
		maxDate,
		onSave,
		onDismiss,
		onDelete,
		existingFilter,
	]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const locale = useMemo(() => i18n.language, [i18n.language]);

	const { width } = Dimensions.get('window');
	const inputWidth = useMemo(() => width * 0.45, [width]);

	const datePickerStyle = useMemo(() => ({ width: inputWidth }), [inputWidth]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<InfoLabelRow
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
					style={datePickerStyle}
				/>
			</InfoLabelRow>

			<InfoLabelRow
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
					style={datePickerStyle}
				/>
			</InfoLabelRow>

			{onDelete && (
				<View style={appSharedStyles.modalControls}>
					<ButtonHighlight
						onPress={handleDelete}
						{...buttonPropsDelete}
					>
						{t('lines.removeFilter')}
					</ButtonHighlight>
				</View>
			)}
		</ModalWrapper>
	);
};

export default memo(FilterDateModal);
