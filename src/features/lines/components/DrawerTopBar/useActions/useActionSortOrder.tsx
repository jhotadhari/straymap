/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import SortOrderModal from '../SortOrderModal';

/**
 * Drawer-top-bar action: opens the sort-order settings modal for the
 * selected-lines list.
 */
const useActionSortOrder = () => {
	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}
		return <SortOrderModal handleDismissModal={handleDismissModal} />;
	}, [modalVisible, handleDismissModal]);

	return useMemo(
		() => ({
			key: 'sortOrder',
			cb,
			label: 'lines.sortOrder',
			leadingIcon: 'sort',
			modalNode,
		}),
		[cb, modalNode]
	);
};

export default useActionSortOrder;
