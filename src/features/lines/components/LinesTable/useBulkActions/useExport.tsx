/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useExportCbModal from '../../../hooks/useExportCbModal';

const useExport = () => {
	const { checkedIds } = useContext(FooterContext);

	const { cb, modalNode } = useExportCbModal({ type: 'bulk', checkedIds });

	return useMemo(
		() => ({
			key: 'export',
			cb,
			label: 'lines.export',
			leadingIcon: 'content-save-outline',
			modalNode,
		}),
		[cb, modalNode]
	);
};

export default useExport;
