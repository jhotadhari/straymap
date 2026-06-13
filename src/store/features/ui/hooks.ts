/**
 * External dependencies
 */
import { useEffect } from 'react';
import { usePromiseQueueState } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../hooks';
import { removeBusyKey, addBusyKey } from './slice';

export const useIsBusyPromiseQueueState = () => {
	const dispatch = useAppDispatch();
	const promiseQueueState = usePromiseQueueState();
	useEffect(() => {
		if (promiseQueueState === 1) {
			dispatch(addBusyKey('promiseQueueState'));
		} else {
			dispatch(removeBusyKey('promiseQueueState'));
		}
	}, [promiseQueueState]);
};
