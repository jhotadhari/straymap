/**
 * External dependencies
 */
import React, { FC, Fragment } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import RoutingActions from '../../../routing/components/RoutingActions';

const DisplayComponent: FC = () => {
	return (
		<Fragment>
			<View style={itemStyles.item}>
				<RoutingActions />

				<PointsList />
			</View>
		</Fragment>
	);
};

export default DisplayComponent;
