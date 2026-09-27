/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../../compose/useButtonProps';
import { useAppDispatch } from '../../../../../store/hooks';
import BottomDrawerContext from '../../../../bottomDrawer/BottomDrawerContext';
import { toggleChartLine } from '../../../../lines/slice';
import { getChartSourceFromKey } from '../../../types';
import useRemoveChartCbModal from '../../../hooks/useRemoveChartCbModal';
import { ChartSettingsModalContext } from '../Context';

const RowRemoveChart: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { chartKey, onDismiss } = useContext(ChartSettingsModalContext);
	const { setActiveItemKey } = useContext(BottomDrawerContext);

	const source = getChartSourceFromKey(chartKey);

	const handleRemove = useCallback(() => {
		if (source?.type !== 'line') {
			return;
		}
		dispatch(toggleChartLine(source.lineId));
		setActiveItemKey(undefined);
	}, [
		dispatch,
		source,
		setActiveItemKey,
	]);

	const { cb, modalNode } = useRemoveChartCbModal({
		onRemove: handleRemove,
		onSuccess: onDismiss,
	});

	const buttonProps = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
	});

	if (source?.type !== 'line') {
		return null;
	}

	return (
		<InfoLabelRow label={t('chart.removeChart')}>
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
