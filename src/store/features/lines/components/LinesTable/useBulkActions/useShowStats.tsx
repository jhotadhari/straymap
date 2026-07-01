/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useShowStatsCbModal from '../../../hooks/useShowStatsCbModal';

const useShowStats = () => {
	const { checkedIds } = useContext(FooterContext);

	const { cb, modalNode, iconSource } = useShowStatsCbModal({
		lineIds: checkedIds,
	});

	return useMemo(
		() => ({
			key: 'showStats',
			cb,
			label: 'showStats',
			leadingIcon: iconSource,
			modalNode,
		}),
		[
			cb,
			iconSource,
			modalNode,
		]
	);
};

export default useShowStats;
