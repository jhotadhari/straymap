/**
 * Internal dependencies
 */
import { useEffect, useRef } from 'react';
import { addBusyKey, removeBusyKey } from '../../../ui/slice';
import { useAppDispatch } from '../../../../store/hooks';
import { makeLayerBusyKey } from '../../utils';

/**
 * Adds a busy key while a layer is expected to render, tracks it across
 * visibility and source changes, and cleans up on unmount.
 *
 * The key is added when shouldRender becomes true and removed when it
 * becomes false or the component unmounts. It is NOT removed when the
 * native layer finishes loading — the `onLayerCreated` callback handles that.
 */
export const useMakeLayerBusy = (
	layerKey: string,
	layerType: string,
	shouldRender: boolean
) => {
	const dispatch = useAppDispatch();
	const didAddRef = useRef(false);
	const busyKey = makeLayerBusyKey(layerType, layerKey);

	useEffect(() => {
		if (shouldRender && !didAddRef.current) {
			didAddRef.current = true;
			dispatch(addBusyKey(busyKey));
		}
		if (!shouldRender && didAddRef.current) {
			didAddRef.current = false;
			dispatch(removeBusyKey(busyKey));
		}
	}, [shouldRender, busyKey, dispatch]);

	useEffect(() => {
		return () => {
			dispatch(removeBusyKey(busyKey));
		};
	}, [busyKey, dispatch]);
};
