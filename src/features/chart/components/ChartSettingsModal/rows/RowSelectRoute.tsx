/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
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

	return (
		<>
			<InfoLabelRow label={t('chart.route')}>
				<ButtonHighlightMenuControl
					options={chartOptions}
					value={activeItemKey}
					setValue={(v) => setActiveItemKey(v)}
					anchorLabel={activeLabel}
					compact
					buttonPropsProps={{ paddingHorizontal: true }}
				/>
			</InfoLabelRow>
		</>
	);
};

export default RowSelectRoute;
