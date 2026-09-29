/**
 * External dependencies
 */
import { useCallback, useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useExportCbModal from '../../../hooks/useExportCbModal';

const useExport = () => {
	const { checkedIds } = useContext(FooterContext);

	const { cb, modalNode } = useExportCbModal({ type: 'bulk', checkedIds });

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	return useMemo(
		() => ({
			key: 'export',
			cb,
			label: 'lines.export',
			leadingIcon: 'content-save-outline',
			modalNode,
			disabled,
		}),
		[
			cb,
			modalNode,
			disabled,
		]
	);
};

export default useExport;
