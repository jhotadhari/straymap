/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import {
	CHART_FULLSCREEN_UI_ITEM_KEY,
	closeFullscreenChart,
	openFullscreenChart,
} from '../../../chart/slice';
import { selectFullscreenLineId } from '../../../chart/selectors';
import { selectUiItemKeys } from '../../../ui/selectors';
import { LineEditModalContext } from './Context';

const ChartIcon: IconSource = ({ color, size }) => (
	<LucideIcons
		color={color}
		size={(size ?? 18) - 2}
		name="chart-line"
		style={styles.iconFix}
	/>
);

/**
 * Opens the standalone fullscreen chart UiItem, dedicated to this line
 * and independent from the bottom drawer charts. Unlike the bottom
 * drawer chart it does not require the line to be on the map.
 */
const RowChartFullscreen: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const { line, onDismiss } = useContext(LineEditModalContext);

	const systemLineIds = useSystemLineIds();

	const uiItemKeys = useAppSelector(selectUiItemKeys);
	const fullscreenLineId = useAppSelector(selectFullscreenLineId);

	const isSystemLine = useMemo(
		() => Object.values(systemLineIds).includes(line?.id ?? -1),
		[systemLineIds, line?.id]
	);

	// Profile/ramp require elevation; lines without Z (never DEM-enriched)
	// have no minZ stats. Disable with a hint to Apply DEM in that case.
	const hasElevation = useMemo(() => line?.stats?.minZ != null, [line?.stats?.minZ]);

	const disabled = useMemo(
		() => !line?.id || isSystemLine || !hasElevation,
		[
			line?.id,
			isSystemLine,
			hasElevation,
		]
	);

	// Active while the fullscreen chart UiItem shows this very line.
	const isActive = useMemo(
		() =>
			typeof line?.id === 'number' &&
			fullscreenLineId === line.id &&
			uiItemKeys.includes(CHART_FULLSCREEN_UI_ITEM_KEY),
		[
			line?.id,
			fullscreenLineId,
			uiItemKeys,
		]
	);

	const handlePress = useCallback(() => {
		if (disabled || typeof line?.id !== 'number') {
			return;
		}
		if (isActive) {
			// Close the fullscreen chart UiItem again.
			dispatch(closeFullscreenChart());
			return;
		}
		// Close the LineEditModal (saving pending edits if dirty) before
		// the fullscreen chart UiItem opens above the map.
		onDismiss();
		dispatch(openFullscreenChart(line.id));
	}, [
		disabled,
		isActive,
		dispatch,
		onDismiss,
		line?.id,
	]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.openFullscreenChart')}
			Info={t('lines.hintOpenFullscreenChart')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={ChartIcon}
			>
				{t('lines.openFullscreenChart')}
				{isActive ? ' ✓' : ''}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

const styles = StyleSheet.create({
	iconFix: {
		marginRight: 2,
	},
});

export default RowChartFullscreen;
