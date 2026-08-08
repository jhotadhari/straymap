/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../../drawers/constants';
import PointsList from '../../components/PointsList';
import DrawerTopBar from '../../components/DrawerTopBar/DrawerTopBar';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppSelector } from '../../../../store/hooks';
import { selectBrouterAvailable } from '../../selectors';
import BrouterUnavailableNotice from '../../components/BrouterUnavailableNotice';

const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);
	const brouterAvailable = useAppSelector(selectBrouterAvailable);

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
			<DrawerTopBar />

			<PointsList />
		</View>
	);
};

export default DisplayComponent;
