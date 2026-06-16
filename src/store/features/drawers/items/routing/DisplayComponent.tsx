/**
 * External dependencies
 */
import React, { FC, Fragment } from 'react';
import { View } from 'react-native';

import { itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import DrawerActions from '../../../routing/components/DrawerActions';

const DisplayComponent: FC = () => {
	return (
		<Fragment>
			<View style={itemStyles.item}>
				<DrawerActions />

				<PointsList />
			</View>
		</Fragment>
	);
};

export default DisplayComponent;
