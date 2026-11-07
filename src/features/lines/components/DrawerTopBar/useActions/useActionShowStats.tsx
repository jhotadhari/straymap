/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import LineStatsModal from '../../Stats/LineStatsModal';

/**
 * Drawer-top-bar action: aggregated stats for all selected lines, via
 * the shared LineStatsModal (same modal as the table and the line edit
 * rows).
 */
const useActionShowStats = ({ lineIds }: { lineIds: number[] }) => {
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
			<LineStatsModal
				handleDismissModal={handleDismissModal}
				lineIds={lineIds}
				showHeader={true}
			/>
		);
	}, [
		modalVisible,
		handleDismissModal,
		lineIds,
	]);

	return useMemo(
		() => ({
			key: 'showStats',
			cb,
			label: 'lines.statsSummary',
			leadingIcon: 'chart-box-outline',
			modalNode,
		}),
		[cb, modalNode]
	);
};

export default useActionShowStats;
