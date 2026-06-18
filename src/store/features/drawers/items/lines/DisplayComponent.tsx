/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import SelectedLinesList from '../../../lines/components/SelectedLinesList/SelectedLinesList';
import DrawerTopBar from '../../../lines/components/DrawerTopBar/DrawerTopBar';
import { itemStyles, handleSize, iconSize } from '../../constants';
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
		<View style={style}>
			<DrawerTopBar />

			<SelectedLinesList />
		</View>
	);
};

export default DisplayComponent;
