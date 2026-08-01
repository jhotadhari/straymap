/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import ImportModal from './ImportModal';

const useImportCbModal = () => {
	const [modalVisible, setModalVisible] = useState(false);

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}
		return <ImportModal handleDismissModal={handleDismissModal} />;
	}, [modalVisible, handleDismissModal]);

	return useMemo(
		() => ({
			cb,
			modalNode,
			iconSource: 'database-import',
		}),
		[cb, modalNode]
	);
};

export default useImportCbModal;
