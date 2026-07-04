/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';

const SettingsGeneral: FC<{ style?: ViewStyle }> = ({ style }) => {
	const controls = useMemo(() => featureRegistry.getSettingsControls(), []);

	return (
		<ScrollView style={style}>
			{controls.map(({ key, Control }) => (
				<Control key={key} />
			))}
		</ScrollView>
	);
};

export default SettingsGeneral;
