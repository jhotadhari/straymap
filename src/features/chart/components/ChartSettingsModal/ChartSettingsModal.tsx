/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { omit, pick } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	PER_CHART_SETTINGS_KEYS,
	GENERAL_ONLY_SETTINGS_KEYS,
	selectGeneralSettings,
	selectHasOwnChartSettings,
	selectOwnPerChartSettings,
	selectChartSettings,
} from '../../selectors';
import { resetChartSettingsToPerChart, setGeneralSettings, setChartSettings } from '../../slice';
import { ChartSettings } from '../../types';
import { ChartSettingsModalContext, ChartSettingsMode } from './Context';
import { sharedStyles } from './sharedDeps';
import RowSelectRoute from './rows/RowSelectRoute';
import RowChartMode from './rows/RowChartMode';
import RowPrimaryData from './rows/RowPrimaryData';
import RowPrimaryColor from './rows/RowPrimaryColor';
import RowSecondaryData from './rows/RowSecondaryData';
import RowSecondaryColor from './rows/RowSecondaryColor';
import RowRatioLock from './rows/RowRatioLock';
import RowFollowMap from './rows/RowFollowMap';
// import RowXMode from './rows/RowXMode';
import RowShowLabel from './rows/RowShowLabel';
import RowShowStats from './rows/RowShowStats';
import RowRemoveChart from './rows/RowRemoveChart';

const ChartSettingsModal: FC<{
	visible: boolean;
	setVisible: (visible: boolean) => void;
	chartKey: string;
	currentRatio?: number;
	fitRatio?: number;
	onFitScreen?: () => void;
}> = ({ visible, setVisible, chartKey, currentRatio, fitRatio, onFitScreen }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const settings = useAppSelector((state) => selectChartSettings(state, chartKey));
	const generalSettings = useAppSelector(selectGeneralSettings);
	const hasOwn = useAppSelector((state) => selectHasOwnChartSettings(state, chartKey));
	const ownPerChartSettings = useAppSelector((state) =>
		selectOwnPerChartSettings(state, chartKey)
	);

	// The mode follows the current chart: 'own' only while the chart
	// has its own settings entry (copied from general on switch).
	const [mode, setModeState] = useState<ChartSettingsMode>(hasOwn ? 'own' : 'general');

	useEffect(() => {
		setModeState(hasOwn ? 'own' : 'general');
	}, [
		chartKey,
		hasOwn,
	]);

	const onDismiss = useCallback(() => {
		setVisible(false);
	}, [setVisible]);

	const update = useCallback(
		(partial: Partial<ChartSettings>) => {
			if (mode === 'own') {
				dispatch(setChartSettings({ key: chartKey, settings: partial }));
			} else {
				dispatch(setGeneralSettings(partial));
			}
		},
		[
			dispatch,
			chartKey,
			mode,
		]
	);

	const updateGeneral = useCallback(
		(partial: Partial<ChartSettings>) => {
			dispatch(setGeneralSettings(partial));
		},
		[dispatch]
	);

	const setMode = useCallback(
		(nextMode: ChartSettingsMode) => {
			if (nextMode === mode) {
				return;
			}
			if (nextMode === 'own') {
				// Copy the current general settings into The chart.s own,
				// preserving its always-per-chart settings (ratio,
				// follow-map) and skipping the always-general ones
				// (label, statistics).
				dispatch(
					setChartSettings({
						key: chartKey,
						settings: {
							...omit(generalSettings, [
								...PER_CHART_SETTINGS_KEYS,
								...GENERAL_ONLY_SETTINGS_KEYS,
							]),
							...pick(ownPerChartSettings, PER_CHART_SETTINGS_KEYS),
						},
					})
				);
			} else {
				// Discard The chart.s own settings — fall back to general,
				// keeping the per-chart settings.
				dispatch(resetChartSettingsToPerChart(chartKey));
			}
			setModeState(nextMode);
		},
		[
			dispatch,
			chartKey,
			mode,
			generalSettings,
			ownPerChartSettings,
		]
	);

	const contextValue = useMemo(
		() => ({
			chartKey,
			settings,
			update,
			updateGeneral,
			onDismiss,
			mode,
			setMode,
			currentRatio,
			fitRatio,
			onFitScreen,
		}),
		[
			chartKey,
			settings,
			update,
			updateGeneral,
			onDismiss,
			mode,
			setMode,
			currentRatio,
			fitRatio,
			onFitScreen,
		]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={t('chart.settingsTitle')}
			innerStyle={sharedStyles.modalInner}
		>
			<ChartSettingsModalContext.Provider value={contextValue}>
				<RowSelectRoute />

				<RowFollowMap />

				<RowRatioLock />

				<RowShowLabel />

				<RowShowStats />

				<RowRemoveChart />

				<Divider />

				<RowChartMode />

				<RowPrimaryData />

				<RowPrimaryColor />

				<RowSecondaryData />

				<RowSecondaryColor />

				{/* <RowXMode /> */}
			</ChartSettingsModalContext.Provider>
		</ModalWrapper>
	);
};

export default ChartSettingsModal;
