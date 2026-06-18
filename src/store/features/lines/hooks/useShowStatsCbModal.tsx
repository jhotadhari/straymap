/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useState } from 'react';
import { get, pick, set } from 'lodash-es';
import { useQuery } from '@tanstack/react-query';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { stylesGeneric } from '../../baseMap/components/controls/layers/LayersControl';
import LineStats from '../components/LineStats';
import { LinePartial, LineStats as LineStatsType } from '../types';
import { queryLinesWithoutGeom } from '../db/queryFns';

// ??? the stats aggregation could be done by db https://orm.drizzle.team/docs/select#aggregations
// ??? well, for now js aggregation is fast enough. and maybe there is more stuff to display one day.

const StatsModal: FC<{
	lineIds: number[];
	handleDismissModal: () => void;
    backgroundBlur?: boolean;
}> = ({ lineIds, handleDismissModal, backgroundBlur }) => {

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
			header={'some stats???'}
			innerStyle={stylesGeneric.modal}
		>
			<Text>{sprintf('??? some stats for %s lines', lineIds.length)}</Text>

			<LineStats stats={stats} />
		</ModalWrapper>
	);
};

const useShowStatsCbModal = ({
	lineIds,
	backgroundBlur,
}: {
	lineIds: number[];
	backgroundBlur?: boolean;
}) => {

	const { t } = useTranslation();

	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}
		return <StatsModal
            handleDismissModal={handleDismissModal}
            backgroundBlur={backgroundBlur}
            lineIds={lineIds}
        />;
	}, [
		t,
		lineIds,
		modalVisible,
		handleDismissModal,
		theme,
	]);

	return {
		cb,
		modalNode,
        iconSource: 'chart-box-outline',
	};
};

export default useShowStatsCbModal;
