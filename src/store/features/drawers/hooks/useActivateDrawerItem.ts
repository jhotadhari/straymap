/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { useCallback, useContext } from 'react';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectSideForKey } from '../selectors';
import { setActiveKey } from '../slice';
import { DrawerControl } from '../types';

const useActivateDrawerItem = (key: string) => {
	const dispatch = useAppDispatch();
	const { drawerControlsRef } = useContext(AppContext);
	const drawerSideWithRouting = useAppSelector((state) => selectSideForKey(state, key));

	const activateDrawerItem = useCallback(() => {
		if (drawerSideWithRouting) {
			dispatch(
				setActiveKey({
					activeKey: key,
				})
			);
			(get(drawerControlsRef?.current, drawerSideWithRouting) as DrawerControl).expand(true);
		}
	}, [
		drawerSideWithRouting,
		key,
		drawerControlsRef?.current,
	]);

	return activateDrawerItem;
};

export default useActivateDrawerItem;
