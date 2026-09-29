/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../../../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { useAppSelector } from '../../../../../store/hooks';
import { OptionBase } from '../../../../../types';
import BottomDrawerContext from '../../../../bottomDrawer/BottomDrawerContext';
import { selectItemKeys } from '../../../../bottomDrawer/selectors';
import { CHART_KEY_PREFIX } from '../../../types';
import { useChartItemLabels } from '../../../hooks/useChartItemLabels';

const buttonPropsProps = { paddingHorizontal: true };

const RowSelectRoute: FC = () => {
	const { t } = useTranslation();
	const { activeItemKey, setActiveItemKey } = useContext(BottomDrawerContext);

	const itemKeys = useAppSelector(selectItemKeys);
	const chartLabels = useChartItemLabels();

	const chartOptions = useMemo(
		() =>
			itemKeys
				.filter((key) => key.startsWith(CHART_KEY_PREFIX))
				.map((key): OptionBase => ({
					key,
					label: chartLabels[key] ?? key,
				})),
		[
			itemKeys,
			chartLabels,
		]
	);

	const activeLabel = activeItemKey ? (chartLabels[activeItemKey] ?? activeItemKey) : '';

	const handleSetValue = useCallback(
		(v: string) => setActiveItemKey(v),
		[setActiveItemKey]
	);

	return (
		<>
			<InfoLabelRow
				label={t('chart.route')}
				Info={t('chart.routeHint')}
			>
				<ButtonHighlightMenuControl
					options={chartOptions}
					value={activeItemKey}
					setValue={handleSetValue}
					anchorLabel={activeLabel}
					compact
					buttonPropsProps={buttonPropsProps}
				/>
			</InfoLabelRow>
		</>
	);
};

export default RowSelectRoute;
