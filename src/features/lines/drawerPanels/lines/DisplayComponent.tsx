/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import SelectedLinesList from '../../components/SelectedLinesList/SelectedLinesList';
import DrawerTopBar from '../../components/DrawerTopBar/DrawerTopBar';
import EmptyState from '../../components/EmptyState/EmptyState';
import DrawerPanelHeading from '../../../drawers/components/DrawerPanelHeading';
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../../drawers/constants';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';

const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);
	const { t } = useTranslation();
	const lineIds = useAppSelector(selectSelected);

	const style = useMemo(
		() => [
			itemStyles.item,
			{
				height,
			},
		],
		[
			height,
		]
	);

	return (
		<View style={style}>
			<View style={styles.headingWrap}>
				<DrawerPanelHeading
					title={t('lines.routesOnMap')}
					style={styles.heading}
				/>
			</View>

			{lineIds.length > 0 ? (
				<>
					<DrawerTopBar />

					<SelectedLinesList />
				</>
			) : (
				<EmptyState />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	headingWrap: {
		// Same negative offset the routing panel's headingWrap uses —
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
