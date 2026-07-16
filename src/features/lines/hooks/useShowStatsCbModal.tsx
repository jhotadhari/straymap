/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useState } from 'react';
import { get, pick, set } from 'lodash-es';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { sharedStyles } from '../../../sharedStyles';
import { LinePartial, LineStats as LineStatsType } from '../types';
import { queryLinesWithoutGeom } from '../db/queryFns';
import LineStatsRows from '../components/Stats/LineStatsRows';

const StatsModal: FC<{
	lineIds: number[];
	handleDismissModal: () => void;
	backgroundBlur?: boolean;
	showHeader?: boolean;
}> = ({ lineIds, handleDismissModal, showHeader, backgroundBlur: _backgroundBlur }) => {
	const { t } = useTranslation();
	const { data: lines } = useQuery({
		queryKey: ['lines', lineIds],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => lines.map((line) => pick(line, ['stats'])),
	});

	const stats: LineStatsType = useMemo(() => {
		if (!lines || !lines.length) {
			return {};
		}
		return lines.reduce<LineStatsType>((acc, line) => {
			Object.keys(line?.stats ?? {}).forEach((key) => {
				switch (key) {
					case 'length':
					case 'uphill':
					case 'downhill':
						set(acc, key, get(acc, key, 0) + get(line?.stats ?? {}, key, 0));
						break;
					case 'minZ':
					case 'maxZ':
						const val = get(line?.stats ?? {}, key);
						if (undefined !== val) {
							const accVal = get(acc, key);
							if (
								undefined === accVal ||
								('minZ' === key && val < accVal) ||
								('maxZ' === key && val > accVal)
							) {
								set(acc, key, val);
							}
						}
						break;
				}
			});
			return acc;
		}, {});
	}, [lines]);

	return (
		<ModalWrapper
			visible={true}
			onDismiss={handleDismissModal}
			header={t('lines.statsSummary')}
			innerStyle={sharedStyles.modal}
		>
			{showHeader && <Text>{sprintf(t('lines.statsForLines'), lineIds.length)}</Text>}

			<LineStatsRows stats={stats} />
		</ModalWrapper>
	);
};

const useShowLinesStatsCbModal = ({
	lineIds,
	backgroundBlur,
	showHeader,
}: {
	lineIds: number[];
	backgroundBlur?: boolean;
	showHeader?: boolean;
}) => {
	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}
		return (
			<StatsModal
				handleDismissModal={handleDismissModal}
				backgroundBlur={backgroundBlur}
				lineIds={lineIds}
				showHeader={showHeader}
			/>
		);
	}, [
		showHeader,
		lineIds,
		modalVisible,
		handleDismissModal,
		backgroundBlur,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
			iconSource: 'chart-box-outline',
		}),
		[cb, modalNode]
	);
};

export default useShowLinesStatsCbModal;
