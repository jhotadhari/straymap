/**
 * External dependencies
 */
import React from 'react';
import { Switch } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';

const ToggleRowControl = ({
	label,
	value,
	onToggle,
}: {
	label: string;
	value: boolean;
	onToggle: () => void;
}) => {
	return (
		<InfoRowControl label={label}>
			<Switch
				value={value}
				onValueChange={onToggle}
			/>
		</InfoRowControl>
	);
};

export default ToggleRowControl;
