/**
 * External dependencies
 */
import { ReactNode } from 'react';
import { Switch } from 'react-native-paper';
import { TextProps, ViewProps } from 'react-native';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';

const ToggleRowControl = ({
	label,
	labelNode,
	value,
	onToggle,
	disabled = false,
	Info,
	style,
	labelStyle,
	innerStyle,
}: {
	label: string;
	labelNode?: ReactNode;
	value: boolean;
	onToggle: () => void;
	disabled?: boolean;
	Info?: ReactNode;
	style?: ViewProps['style'];
	labelStyle?: TextProps['style'];
	innerStyle?: ViewProps['style'];
}) => {
	return (
		<InfoLabelRow
			label={label}
			labelNode={labelNode}
			Info={Info}
			style={style}
			labelStyle={labelStyle}
			innerStyle={innerStyle}
		>
			<Switch
				value={value}
				onValueChange={onToggle}
				disabled={disabled}
			/>
		</InfoLabelRow>
	);
};

export default ToggleRowControl;
