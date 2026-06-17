/**
 * External dependencies
 */
import { useContext, useCallback, useState, useMemo, FC } from 'react';
import { get, pick, set, uniq } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { sprintf } from 'sprintf-js';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import ModalWrapper from '../../../../../../components/generic/ModalWrapper';
import { stylesGeneric } from '../../../../baseMap/components/controls/layers/LayersControl';
import { useQuery } from '@tanstack/react-query';
import { queryLinesWithoutGeom } from '../../../db/queryFns';
import { LinePartial, LineStats as LineStatsType } from '../../../types';
import LineStats from '../../LineStats';

// ??? the stats aggregation could be done by db https://orm.drizzle.team/docs/select#aggregations
// ??? well, for now js aggregation is fast enough. and maybe there is more stuff to display one day.

const StatsModal: FC<{
	handleDismissModal: () => void;
}> = ({ handleDismissModal }) => {
	const { checkedIds } = useContext(FooterContext);

	const { data: lines } = useQuery({
		queryKey: ['lines', checkedIds],
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
			<Text>{sprintf('??? some stats for %s lines', checkedIds.length)}</Text>

			<LineStats stats={stats} />
		</ModalWrapper>
	);
};

const useShowStats = () => {
	const { t } = useTranslation();

	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const { checkedIds } = useContext(FooterContext);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}
		return <StatsModal handleDismissModal={handleDismissModal} />;
	}, [
		t,
		checkedIds,
		modalVisible,
		handleDismissModal,
		theme,
	]);

	return {
		key: 'showStats',
		cb,
		label: 'showStats',
		leadingIcon: 'chart-box-outline',
		modalNode,
	};
};

export default useShowStats;
