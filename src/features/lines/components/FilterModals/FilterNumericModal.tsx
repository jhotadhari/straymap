/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
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
import { NumericColumnFilter, getFilterKey } from '../../types';

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

	const buttonPropsDelete = useButtonProps({ isDestructive: true });

	const unitPrefKey = getUnitPrefKey(columnKey);
	const unitPref = unitPrefKey ? unitPrefs[unitPrefKey] : undefined;

	const toDisplay = useCallback(
		(val: number | undefined): number | undefined => {
			if (val === undefined) return undefined;
			if (!unitPref) return val;
			if (unitPrefKey === 'distance') return toDisplayDistance(val, unitPref);
			if (unitPrefKey === 'heightDepth') return toDisplayHeightDepth(val, unitPref);
			return val;
		},
		[unitPref, unitPrefKey]
	);

	const fromDisplay = useCallback(
		(val: number): number => {
			if (!unitPref) return val;
			if (unitPrefKey === 'distance') return parseDistance(val, unitPref);
			if (unitPrefKey === 'heightDepth') return parseHeightDepth(val, unitPref);
			return val;
		},
		[unitPref, unitPrefKey]
	);

	const [minMetric, setMinMetric] = useState<number | undefined>(existingFilter?.min);
	const [maxMetric, setMaxMetric] = useState<number | undefined>(existingFilter?.max);

	const handleDismiss = useCallback(() => {
		const bothEmpty = minMetric === undefined && maxMetric === undefined;
		if (bothEmpty) {
			if (existingFilter) {
				// Clearing both bounds on an existing filter → remove it.
				onDelete?.();
			}
			// New filter with no bounds → no-op, just close.
			onDismiss();
			return;
		}
		const newFilter: NumericColumnFilter = {
			type: 'numeric',
			columnKey,
			min: minMetric,
			max: maxMetric,
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
		minMetric,
		maxMetric,
		onSave,
		onDismiss,
		onDelete,
		existingFilter,
	]);

	const prevVisibleRef = useRef(false);
	useEffect(() => {
		const justOpened = visible && !prevVisibleRef.current;
		prevVisibleRef.current = visible;
		if (justOpened) {
			setMinMetric(existingFilter?.min);
			setMaxMetric(existingFilter?.max);
		}
	}, [
		visible,
		existingFilter,
	]);

	const handleDelete = useCallback(() => {
		onDelete?.();
		onDismiss();
	}, [onDelete, onDismiss]);

	const columnLabel = useMemo(() => t(`lines.columns.${columnKey}`), [t, columnKey]);

	const unitSuffix = useMemo(() => {
		if (!unitPref) return '';
		if (unitPrefKey === 'distance') return getDistanceUnitSuffix(unitPref);
		if (unitPrefKey === 'heightDepth') return getHeightDepthUnitSuffix(unitPref);
		return '';
	}, [unitPref, unitPrefKey]);

	const labelWithUnit = useCallback(
		(baseLabel: string): string => {
			return unitSuffix ? `${baseLabel} (${unitSuffix})` : baseLabel;
		},
		[unitSuffix]
	);

	const handleSetMin = useCallback(
		(newValue: number) => {
			setMinMetric(fromDisplay(newValue));
		},
		[fromDisplay]
	);

	const handleSetMax = useCallback(
		(newValue: number) => {
			setMaxMetric(fromDisplay(newValue));
		},
		[fromDisplay]
	);

	const handleClearMin = useCallback(() => {
		setMinMetric(undefined);
	}, []);

	const handleClearMax = useCallback(() => {
		setMaxMetric(undefined);
	}, []);

	const minDisplay = toDisplay(minMetric);
	const maxDisplay = toDisplay(maxMetric);

	const numType = 'float';

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={columnLabel}
			innerStyle={sharedStyles.modalInner}
		>
			<NumericRowControl
				label={labelWithUnit(t('lines.filterMin'))}
				Info={t('lines.hintNumericFilter')}
				value={minDisplay}
				onUpdate={handleSetMin}
				onClear={handleClearMin}
				numType={numType}
			/>

			<NumericRowControl
				label={labelWithUnit(t('lines.filterMax'))}
				Info={t('lines.hintNumericFilter')}
				value={maxDisplay}
				onUpdate={handleSetMax}
				onClear={handleClearMax}
				numType={numType}
			/>

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

export default FilterNumericModal;
