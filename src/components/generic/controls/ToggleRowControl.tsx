/**
 * External dependencies
 */
import { ReactNode } from 'react';
import { Switch } from 'react-native-paper';
import { ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';

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
		<InfoLabelRow
			label={label}
			Info={Info}
			style={style}
		>
			<Switch
				value={value}
				onValueChange={onToggle}
			/>
		</InfoLabelRow>
	);
};

export default ToggleRowControl;
