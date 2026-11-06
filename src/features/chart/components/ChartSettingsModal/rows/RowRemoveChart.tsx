/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import BottomDrawerContext from '../../../../bottomDrawer/BottomDrawerContext';
import { toggleChartLine } from '../../../../lines/slice';
import { selectIsRouting, selectRoutingLineId } from '../../../../routing/selectors';
import { selectFollowingLineId } from '../../../../lineFollow/selectors';
import { selectIsRecording, selectActiveLineId } from '../../../../trackRecording/selectors';
import { getChartSourceFromKey } from '../../../types';
import useRemoveChartCbModal from '../../../hooks/useRemoveChartCbModal';
import { ChartSettingsModalContext } from '../Context';

const RowRemoveChart: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, onDismiss } = useContext(ChartSettingsModalContext);
	const { setActiveItemKey } = useContext(BottomDrawerContext);

	const isRouting = useAppSelector(selectIsRouting);
	const routingLineId = useAppSelector(selectRoutingLineId);
	const followingLineId = useAppSelector(selectFollowingLineId);
	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);

	const source = getChartSourceFromKey(chartKey);
	const lineId = source?.type === 'line' ? source.lineId : null;

	// Feature-derived charts (routing / followed / recording line) exist
	// in the drawer automatically while their mode is active — they are
	// not driven by chartLines, so toggleChartLine would be a silent
	// no-op (or flip the line's persistent chart state for later).
	// Disable removal instead; the chart disappears when the mode ends.
	const isFeatureChart = useMemo(
		() =>
			lineId != null &&
			((isRouting && lineId === routingLineId) ||
				lineId === followingLineId ||
				(isRecording && lineId === activeLineId)),
		[
			lineId,
			isRouting,
			routingLineId,
			followingLineId,
			isRecording,
			activeLineId,
		]
	);

	// Mode label for the disabled hint (priority: routing > following >
	// recording — a line can be the routing line while followed).
	const modeLabelKey = useMemo(() => {
		if (lineId == null) {
			return null;
		}
		if (isRouting && lineId === routingLineId) {
			return 'chart.modeRouting';
		}
		if (lineId === followingLineId) {
			return 'chart.modeFollowing';
		}
		if (isRecording && lineId === activeLineId) {
			return 'chart.modeRecording';
		}
		return null;
	}, [
		lineId,
		isRouting,
		routingLineId,
		followingLineId,
		isRecording,
		activeLineId,
	]);

	const infoLabel = useMemo(() => {
		if (!isFeatureChart || !modeLabelKey) {
			return t('chart.removeChartHint');
		}
		return t('chart.removeChartDisabledHint', { mode: t(modeLabelKey) });
	}, [
		isFeatureChart,
		modeLabelKey,
		t,
	]);

	const handleRemove = useCallback(() => {
		if (isFeatureChart || source?.type !== 'line') {
			return;
		}
		dispatch(toggleChartLine(source.lineId));
		setActiveItemKey(undefined);
	}, [
		dispatch,
		source,
		isFeatureChart,
		setActiveItemKey,
	]);

	const { cb, modalNode } = useRemoveChartCbModal({
		onRemove: handleRemove,
		onSuccess: onDismiss,
	});

	const buttonProps = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
		disabled: isFeatureChart,
	});

	if (source?.type !== 'line') {
		return null;
	}

	return (
		<InfoLabelRow
			label={t('chart.removeChart')}
			Info={infoLabel}
		>
			{modalNode}
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={cb}
				icon="close"
			>
				{t('chart.removeChart')}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowRemoveChart;
