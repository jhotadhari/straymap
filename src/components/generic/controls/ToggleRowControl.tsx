/**
 * External dependencies
 */
import { ReactNode } from 'react';
import { Switch } from 'react-native-paper';
import { ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';

const ToggleRowControl = ({
	label,
	value,
	onToggle,
	Info,
	style,
}: {
	label: string;
	value: boolean;
	onToggle: () => void;
	Info?: ReactNode;
	style?: ViewStyle;
}) => {
	return (
		<InfoRowControl
			label={label}
			Info={Info}
			style={style}
		>
			<Switch
				value={value}
				onValueChange={onToggle}
			/>
		</InfoRowControl>
	);
};

export default ToggleRowControl;
