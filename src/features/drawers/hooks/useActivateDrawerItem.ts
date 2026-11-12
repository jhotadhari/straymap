/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { useCallback, useContext } from 'react';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../Context';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectSideForKey } from '../selectors';
import { setActiveKey, setSideOfferKey } from '../slice';
import { DrawerControl } from '../types';

/**
 * Opens a drawer panel: dispatches the panel's activation and expands
 * its side. When the panel isn't assigned to any side ('available' /
 * hidden), it instead sets the global side-offer key — the always
 * mounted AssignDrawerPanelSideHost picks it up and shows the
 * "add panel to a side" modal with left/right buttons.
 */
const useActivateDrawerItem = (key: string) => {
	const dispatch = useAppDispatch();
	const { drawerControlsRef } = useContext(AppContext);
	const drawerSideWithRouting = useAppSelector((state) => selectSideForKey(state, key));

	const activateDrawerItem = useCallback(
		(expanded?: number | boolean) => {
			if (drawerSideWithRouting) {
				dispatch(
					setActiveKey({
						activeKey: key,
					})
				);
				(get(drawerControlsRef?.current, drawerSideWithRouting) as DrawerControl).expand(
					undefined !== expanded ? expanded : true
				);
			} else {
				dispatch(setSideOfferKey(key));
			}
		},
		[
			drawerSideWithRouting,
			key,
			dispatch,
			drawerControlsRef,
		]
	);

	return activateDrawerItem;
};

export default useActivateDrawerItem;
