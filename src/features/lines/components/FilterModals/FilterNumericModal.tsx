/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import {
	toDisplayDistance,
	toDisplayHeightDepth,
	parseDistance,
	parseHeightDepth,
	getDistanceUnitSuffix,
	getHeightDepthUnitSuffix,
} from '../../../../lib/formatting';
import { sharedStyles, getUnitPrefKey } from './sharedDeps';
import { NumericColumnFilter } from '../../types';

const FilterNumericModal: FC<{
	visible: boolean;
	columnKey: string;
	existingFilter?: NumericColumnFilter;
	onDismiss: () => void;
	onSave: (filter: NumericColumnFilter) => void;
	onDelete?: () => void;
}> = ({ visible, columnKey, existingFilter, onDismiss, onSave, onDelete }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const unitPrefKey = getUnitPrefKey(columnKey);
	const unitPref = unitPrefKey ? unitPrefs[unitPrefKey] : undefined;

	// Convert internal metric value → display value for the text input.
	const metricToDisplay = useCallback(
		(val: number | undefined): string => {
			if (val === undefined) return '';
			if (!unitPref) return val.toString();
			if (unitPrefKey === 'distance') {
				return toDisplayDistance(val, unitPref).toString();
			}
			if (unitPrefKey === 'heightDepth') {
				return toDisplayHeightDepth(val, unitPref).toString();
			}
			return val.toString();
		},
		[unitPref, unitPrefKey]
	);

	// Convert user-entered display value → internal metric.
	const displayToMetric = useCallback(
		(val: string): number | undefined => {
			const trimmed = val.trim();
			if (trimmed === '' || trimmed === '-') return undefined;
			const parsed = parseFloat(trimmed.replace(/,/g, '.'));
			if (isNaN(parsed)) return undefined;
			if (!unitPref) return parsed;
			if (unitPrefKey === 'distance') {
				return parseDistance(parsed, unitPref);
			}
			if (unitPrefKey === 'heightDepth') {
				return parseHeightDepth(parsed, unitPref);
			}
			return parsed;
		},
		[unitPref, unitPrefKey]
	);

	const [minVal, setMinVal] = useState<string>(metricToDisplay(existingFilter?.min));
	const [maxVal, setMaxVal] = useState<string>(metricToDisplay(existingFilter?.max));

	const saveRef = useRef<undefined | (() => void)>(undefined);

	useEffect(() => {
		saveRef.current = () => {
			const minNb = displayToMetric(minVal);
			const maxNb = displayToMetric(maxVal);
			// Save when values are non-empty, OR when editing an existing
			// filter (allows clearing by dismissing with empty inputs).
			if (minNb !== undefined || maxNb !== undefined || existingFilter) {
				onSave({
					type: 'numeric',
					columnKey,
					min: minNb,
					max: maxNb,
				});
			}
		};
	}, [
		columnKey,
		minVal,
		maxVal,
		onSave,
		existingFilter,
		displayToMetric,
	]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setMinVal(metricToDisplay(existingFilter?.min));
			setMaxVal(metricToDisplay(existingFilter?.max));
		}
	}, [
		visible,
		existingFilter,
		metricToDisplay,
	]);

	const handleDismiss = useCallback(() => {
		saveRef.current?.();
		onDismiss();
	}, [onDismiss]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	// Unit suffix to show next to / below each input.
	const unitSuffix = useMemo(() => {
		if (!unitPref) return '';
		if (unitPrefKey === 'distance') return getDistanceUnitSuffix(unitPref);
		if (unitPrefKey === 'heightDepth') return getHeightDepthUnitSuffix(unitPref);
		return '';
	}, [unitPref, unitPrefKey]);

	const suffixTextStyle = useMemo(
		() => ({
			color: theme.colors.onSurfaceVariant,
			fontSize: 12,
			marginLeft: 4,
		}),
		[theme]
	);

	const labelWithUnit = useCallback(
		(baseLabel: string): string => {
			return unitSuffix ? `${baseLabel} (${unitSuffix})` : baseLabel;
		},
		[unitSuffix]
	);

	const inputStyle = useMemo(
		() => [
			styles.input,
			{
				color: theme.colors.onSurface,
				borderColor: theme.colors.outline,
			},
		],
		[theme]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<InfoLabelRow
				label={labelWithUnit(t('lines.filterMin'))}
				Info={t('lines.hintNumericFilter')}
			>
				<View style={styles.inputRow}>
					<TextInput
						style={inputStyle}
						value={minVal}
						onChangeText={setMinVal}
						placeholder="-"
						placeholderTextColor={theme.colors.outline}
						keyboardType="numeric"
					/>
					{unitSuffix !== '' && <Text style={suffixTextStyle}>{unitSuffix}</Text>}
				</View>
			</InfoLabelRow>

			<InfoLabelRow
				label={labelWithUnit(t('lines.filterMax'))}
				Info={t('lines.hintNumericFilter')}
			>
				<View style={styles.inputRow}>
					<TextInput
						style={inputStyle}
						value={maxVal}
						onChangeText={setMaxVal}
						placeholder="-"
						placeholderTextColor={theme.colors.outline}
						keyboardType="numeric"
					/>
					{unitSuffix !== '' && <Text style={suffixTextStyle}>{unitSuffix}</Text>}
				</View>
			</InfoLabelRow>

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

const styles = StyleSheet.create({
	input: {
		borderWidth: 1,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		minWidth: 100,
		textAlign: 'right',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default FilterNumericModal;
