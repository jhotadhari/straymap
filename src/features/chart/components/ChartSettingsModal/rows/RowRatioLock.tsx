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

const validatePositive = (val: number) => val > 0;

/**
 * The ratio is always per-chart ("custom"): read from and written to
 * the chart.s own entry, independent of the Default/Custom mode.
 * The field is always editable; the button resets the value to the
 * natural fit ratio and requests a full viewport reset.
 */
const RowRatioLock: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, settings, currentRatio, onFitScreen } = useContext(ChartSettingsModalContext);

	const handleFitScreen = useCallback(() => {
		// Reset restores the natural fit: clear the ratio lock so the chart
		// keeps re-fitting on route changes (rather than pinning the old
		// natural-fit value).
		dispatch(setChartSettings({ key: chartKey, settings: { ratioValue: undefined } }));
		onFitScreen && onFitScreen();
	}, [
		dispatch,
		chartKey,
		onFitScreen,
	]);

	const handleUpdate = useCallback(
		(newValue: number) => {
			dispatch(setChartSettings({ key: chartKey, settings: { ratioValue: newValue } }));
		},
		[dispatch, chartKey]
	);

	const rounded =
		'number' === typeof currentRatio && isFinite(currentRatio)
			? roundTo(currentRatio, 4)
			: undefined;
	const hasRatio = settings.ratioValue != null;

	return (
		<NumericRowControl
			label={t('chart.ratio')}
			Info={t('chart.ratioHint')}
			buttonLabel={t('chart.ratioReset')}
			onButtonPress={handleFitScreen}
			value={settings.followMode === 'map' || !hasRatio ? undefined : rounded}
			placeholder={!hasRatio && rounded !== undefined ? String(rounded) : undefined}
			onUpdate={handleUpdate}
			numType="float"
			validate={validatePositive}
			disabled={settings.followMode === 'map'}
		/>
	);
};

export default RowRatioLock;
