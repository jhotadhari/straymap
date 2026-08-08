/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useApplyDemCbModal from '../../../hooks/useApplyDemCbModal';

const useApplyDem = () => {
	const { checkedIds } = useContext(FooterContext);

	const { cb, modalNode, IconComponent } = useApplyDemCbModal({
		lineIdsOrId: checkedIds,
	});

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	return useMemo(
		() => ({
			key: 'applyDem',
			cb,
			label: 'lines.applyDem',
			IconComponent,
			modalNode,
			disabled,
		}),
		[
			cb,
			IconComponent,
			modalNode,
			disabled,
		]
	);
};

export default useApplyDem;
