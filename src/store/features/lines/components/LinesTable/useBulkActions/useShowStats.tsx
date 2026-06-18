/**
 * External dependencies
 */
import { useContext } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import useShowStatsCbModal from '../../../hooks/useShowStatsCbModal';

const useShowStats = () => {

	const { checkedIds } = useContext(FooterContext);

	const {
		cb,
		modalNode,
		iconSource,
	} = useShowStatsCbModal( {
		lineIds: checkedIds ,
	} );

	return {
		key: 'showStats',
		cb,
		label: 'showStats',
		leadingIcon: iconSource,
		modalNode,
	};
};

export default useShowStats;
