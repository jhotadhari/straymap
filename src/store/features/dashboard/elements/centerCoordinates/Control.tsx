/**
 * External dependencies
 */
import React, {
	FC,
} from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { DashboardItem } from '../../types';
import { Options } from './Display';
import UnitPrefControl from './UnitPrefControl';


const Control: FC<{
	item: DashboardItem<Options>;
}> = ({
	item,
}) => {

	return (
		<View>
			<UnitPrefControl
				item={item}
				unitPrefsKey="coordinates"
			/>
		</View>
	);
};

export default Control;
