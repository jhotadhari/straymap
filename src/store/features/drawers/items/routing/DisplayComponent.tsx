/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import DrawerTopBar from '../../../routing/components/DrawerTopBar/DrawerTopBar';
import DrawerContext from '../../DrawerContext';

const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);

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

	return (
		<View style={style}>
			<DrawerTopBar />

			<PointsList />
		</View>
	);
};

export default DisplayComponent;
