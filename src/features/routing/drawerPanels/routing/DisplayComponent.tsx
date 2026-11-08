/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../../drawers/constants';
import DrawerPanelHeading from '../../../drawers/components/DrawerPanelHeading';
import PointsList from '../../components/PointsList';
import DrawerTopBar from '../../components/DrawerTopBar/DrawerTopBar';
import useToggleRouting from '../../components/DrawerTopBar/useToggleRouting';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppSelector } from '../../../../store/hooks';
import { selectBrouterAvailable, selectIsRouting } from '../../selectors';
import BrouterUnavailableNotice from '../../components/BrouterUnavailableNotice';

const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);
	const { t } = useTranslation();
	const brouterAvailable = useAppSelector(selectBrouterAvailable);
	const isRouting = useAppSelector(selectIsRouting);

	const { isToggling, handleToggleRouting } = useToggleRouting({
		routeId: isRouting || undefined,
	});

	const style = useMemo(
		() => [
			itemStyles.item,
			{
				height: height - (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE),
			},
		],
		[
			height,
		]
	);

	// Show the routing UI only when BRouter is confirmed available
	// or while the check is still pending (null = unchecked).
	if (brouterAvailable === false) {
		return (
			<View style={style}>
				<BrouterUnavailableNotice />
			</View>
		);
	}

	return (
		<View style={style}>
			<View style={styles.headingWrap}>
				<DrawerPanelHeading
					title={t('routing.routePlanning')}
					actionIcon={isRouting ? 'close' : undefined}
					onActionPress={isRouting ? handleToggleRouting : undefined}
					actionAccessibilityLabel={t('routing.stopRouting')}
					actionDisabled={isToggling}
					style={styles.heading}
				/>
			</View>

			<DrawerTopBar />

			<PointsList />
		</View>
	);
};

const styles = StyleSheet.create({
	headingWrap: {
		// Same negative offset the tracking panel's headerWrap uses —
		// paired with the buttonRow marginTop it puts the heading row
		// exactly over the 50dp drawer handle box.
		top: -(DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 6,
	},
	heading: {
		// Handle-height row: top and bottom edges flush with the drawer
		// handle box. The 10dp bottom margin compensates for the buttonRow
		// bottom margin and panel gap, centering the buttons row below on
		// the second drawer handle.
		height: DRAWER_HANDLE_SIZE,
		marginRight: 12,
		marginBottom: 10,
	},
});

export default DisplayComponent;
