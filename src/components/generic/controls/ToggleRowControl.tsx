/**
 * External dependencies
 */
import { ReactNode } from 'react';
import { Switch } from 'react-native-paper';
import { TextProps, ViewProps, ViewStyle } from 'react-native';

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
	labelStyle,
	innerStyle,
}: {
	label: string;
	value: boolean;
	onToggle: () => void;
	Info?: ReactNode;
	style?: ViewProps['style'];
	labelStyle?: TextProps['style'];
	innerStyle?: ViewProps['style'];
}) => {
	return (
		<InfoLabelRow
			label={label}
			Info={Info}
			style={style}
			labelStyle={labelStyle}
			innerStyle={innerStyle}
		>
			<Switch
				value={value}
				onValueChange={onToggle}
			/>
		</InfoLabelRow>
	);
};

export default ToggleRowControl;
