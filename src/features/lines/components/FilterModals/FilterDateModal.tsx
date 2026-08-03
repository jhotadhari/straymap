/**
 * External dependencies
 */
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import dayjs from '../../../../lib/dayjs';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';
import DateTimePickerControl from '../../../../components/generic/controls/DateTimePickerControl';
import { useButtonProps } from '../../../../compose/useButtonProps';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppSelector } from '../../../../store/hooks';
import { selectDateTimeFormat } from '../../../general/selectors';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { sharedStyles } from './sharedDeps';
import { DateColumnFilter, getFilterKey } from '../../types';

const EditIconAnchor = memo<{ onPress: () => void }>(({ onPress }) => (
	<IconButtonHighlight
		style={localStyles.editIcon}
		icon="calendar-edit"
		onPress={onPress}
		size={20}
	/>
));

const dateToString = (d: Date | undefined, opts?: { endOfDay?: boolean }): string | undefined => {
	if (!d) {
		return undefined;
	}
	const dj = dayjs(d);
	return (opts?.endOfDay ? dj.endOf('day') : dj).format('YYYY-MM-DD HH:mm:ss');
};

const stringToDate = (s: string | undefined): Date | undefined => {
	if (!s) {
		return undefined;
	}
	const parsed = dayjs(s);
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

	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

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
		const maxStr = dateToString(maxDate, { endOfDay: true });
		const bothEmpty = minStr === undefined && maxStr === undefined;
		if (bothEmpty) {
			if (existingFilter) {
				onDelete?.();
			}
			onDismiss();
			return;
		}
		const newFilter: DateColumnFilter = {
			type: 'date',
			columnKey,
			min: minStr,
			max: maxStr,
		};
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

	const handleClearMin = useCallback(() => setMinDate(undefined), []);

	const handleClearMax = useCallback(() => setMaxDate(undefined), []);

	const handleMinNow = useCallback(() => setMinDate(new Date()), []);

	const handleMaxNow = useCallback(() => setMaxDate(new Date()), []);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const locale = useMemo(() => i18n.language, [i18n.language]);

	const formatDisplay = useCallback(
		(d: Date | undefined) => (d ? dayjs(d).format(dateTimeFormat) : ''),
		[dateTimeFormat]
	);

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
				<View
					style={[
						appSharedStyles.flexRowCenter,
						localStyles.flexSpaceBetween,
					]}
				>
					<Text style={appSharedStyles.flex1}>{formatDisplay(minDate)}</Text>
					<View style={appSharedStyles.flexRowCenter}>
						{minDate !== undefined && (
							<IconButtonHighlight
								style={localStyles.iconDelete}
								icon="delete-outline"
								onPress={handleClearMin}
								size={20}
							/>
						)}
						<DateTimePickerControl
							value={minDate}
							onUpdate={setMinDate}
							format={dateTimeFormat}
							locale={locale}
							anchor={EditIconAnchor}
							onBeforeOpen={minDate ? undefined : handleMinNow}
						/>
					</View>
				</View>
			</InfoLabelRow>

			<InfoLabelRow
				label={t('lines.filterMax')}
				Info={t('lines.hintDateFilter')}
			>
				<View
					style={[
						appSharedStyles.flexRowCenter,
						localStyles.flexSpaceBetween,
					]}
				>
					<Text style={appSharedStyles.flex1}>{formatDisplay(maxDate)}</Text>
					<View style={appSharedStyles.flexRowCenter}>
						{maxDate !== undefined && (
							<IconButtonHighlight
								style={localStyles.iconDelete}
								icon="delete-outline"
								onPress={handleClearMax}
								size={20}
							/>
						)}
						<DateTimePickerControl
							value={maxDate}
							onUpdate={setMaxDate}
							format={dateTimeFormat}
							locale={locale}
							anchor={EditIconAnchor}
							onBeforeOpen={maxDate ? undefined : handleMaxNow}
						/>
					</View>
				</View>
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

const localStyles = StyleSheet.create({
	editIcon: {
		marginLeft: 0,
	},
	flexSpaceBetween: {
		justifyContent: 'space-between',
	},
	iconDelete: {
		marginHorizontal: 0,
	},
});

export default memo(FilterDateModal);
