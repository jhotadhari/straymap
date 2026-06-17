/**
 * External dependencies
 */
import React, { FC, Fragment, useContext, useMemo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { handleSize, iconSize, itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import RoutingBar from '../../../routing/components/RoutingBar';
import DrawerContext from '../../DrawerContext';

const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);

	const style = useMemo(
		() => [
			itemStyles.item,
			{
				height: height - (handleSize - iconSize),
			},
		],
		[
			height,
			handleSize,
			iconSize,
		]
	);

	return (
		<Fragment>
			<View style={style}>
				<RoutingBar />

				<PointsList />
			</View>
		</Fragment>
	);
};

export default DisplayComponent;
