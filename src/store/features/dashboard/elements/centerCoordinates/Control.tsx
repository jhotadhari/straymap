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
import ItemUnitPrefControl from '../../components/controls/ItemUnitPrefControl';


const Control: FC = () => {

	return (
		<View>
			<ItemUnitPrefControl
				unitPrefsKey="coordinates"
			/>
		</View>
	);
};

export default Control;
