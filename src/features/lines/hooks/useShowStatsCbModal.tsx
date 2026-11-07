/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import LineStatsModal from '../components/Stats/LineStatsModal';

/**
 * Stats modal trigger — returns `{ cb, modalNode, iconSource }` so it
 * can be used from a button, a menu action or a modal row.  Renders the
 * shared LineStatsModal (geometry stats + recording-metadata section).
 */
const useShowLinesStatsCbModal = ({
	lineIds,
	showHeader,
}: {
	lineIds: number[];
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
			<LineStatsModal
				handleDismissModal={handleDismissModal}
				lineIds={lineIds}
				showHeader={showHeader}
			/>
		);
	}, [
		showHeader,
		lineIds,
		modalVisible,
		handleDismissModal,
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
