/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { useAppDispatch } from '../../../../../store/hooks';
import { roundTo } from '../../../../../lib/utilsLight';
import { setChartSettings } from '../../../slice';
import { ChartSettingsModalContext } from '../Context';

/**
 * The ratio is always per-chart ("custom"): read from and written to
 * the chart.s own entry, independent of the Default/Custom mode.
 * The field is always editable; the button resets the value to the
 * natural fit ratio and requests a full viewport reset.
 */
const RowRatioLock: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, settings, currentRatio, fitRatio, onFitScreen } =
		useContext(ChartSettingsModalContext);

	const handleFitScreen = useCallback(() => {
		dispatch(setChartSettings({ key: chartKey, settings: { ratioValue: fitRatio } }));
		onFitScreen && onFitScreen();
	}, [
		dispatch,
		chartKey,
		fitRatio,
		onFitScreen,
	]);

	const handleUpdate = useCallback(
		(newValue: number) => {
			dispatch(setChartSettings({ key: chartKey, settings: { ratioValue: newValue } }));
		},
		[dispatch, chartKey]
	);

	const rawValue = currentRatio;
	const value =
		'number' === typeof rawValue && isFinite(rawValue) ? roundTo(rawValue, 4) : rawValue;

	return (
		<NumericRowControl
			label={t('chart.ratio')}
			Info={t('chart.ratioHint')}
			buttonLabel={t('chart.ratioReset')}
			onButtonPress={handleFitScreen}
			value={settings.followMap ? undefined : value}
			onUpdate={handleUpdate}
			numType="float"
			validate={(val) => val > 0}
			disabled={settings.followMap}
		/>
	);
};

export default RowRatioLock;
