/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../Context';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { featureRegistry } from '../../FeatureRegistry';
import { selectSideOfferKey } from '../selectors';
import { moveItemKey, setActiveKey, setSideOfferKey } from '../slice';
import { DrawerControl } from '../types';
import AssignDrawerPanelModal from '../components/AssignDrawerPanelModal';

/**
 * Always-mounted host for the global "add panel to a side" offer modal.
 * Any `useActivateDrawerItem` call for a panel that isn't assigned to a
 * side sets the side-offer key in the drawers slice; this overlay picks
 * it up and renders the modal. Picking a side moves the panel there,
 * activates it and expands that drawer side.
 *
 * Registered as its own appOverlay (not gated by the Drawers overlay's
 * uiItems-hide) so the offer also works from fullscreen pages.
 */
const AssignDrawerPanelSideHost = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const { drawerControlsRef } = useContext(AppContext);
	const offerKey = useAppSelector(selectSideOfferKey);

	const panelLabel = useMemo(() => {
		if (!offerKey) {
			return '';
		}
		const panel = featureRegistry.getDrawerPanels()[offerKey];
		return panel?.label ? t(panel.label) : offerKey;
	}, [offerKey, t]);

	const handleDismiss = useCallback(() => {
		dispatch(setSideOfferKey(null));
	}, [dispatch]);

	const handleAssign = useCallback(
		(side: 'left' | 'right') => {
			if (!offerKey) {
				return;
			}
			dispatch(
				moveItemKey({
					itemKey: offerKey,
					side,
					index: Infinity,
				})
			);
			dispatch(
				setActiveKey({
					activeKey: offerKey,
				})
			);
			(get(drawerControlsRef?.current, side) as DrawerControl).expand(true);
			dispatch(setSideOfferKey(null));
		},
		[
			offerKey,
			dispatch,
			drawerControlsRef,
		]
	);

	return (
		<AssignDrawerPanelModal
			visible={!!offerKey}
			panelLabel={panelLabel}
			onDismiss={handleDismiss}
			onAssign={handleAssign}
		/>
	);
};

export default AssignDrawerPanelSideHost;
