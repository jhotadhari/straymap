/**
 * External dependencies
 */
import { TextStyle } from 'react-native';
import { RadioButton } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';
import InfoLabelRow from './InfoLabelRow';
import { ReactNode, useMemo } from 'react';

const InfoRadioRow = ({
	opt,
	onPress,
	Info,
	labelExtractor,
	labelStyle = {},
	status = 'unchecked',
	radioAlign = 'right',
}: {
	opt: OptionBase;
	onPress: () => void;
	Info?: ReactNode | string;
	labelExtractor?: (opt: OptionBase) => string | null;
	labelStyle?: TextStyle;
	status?: 'unchecked' | 'checked';
	radioAlign?: 'left' | 'right';
}) => {
	const label = labelExtractor ? labelExtractor(opt) : null;

	const labelStyleMerged = useMemo(
		() => ({
			...labelStyle,
			...('right' === radioAlign && { flexGrow: 1 }),
		}),
		[labelStyle, radioAlign]
	);

	return (
		<InfoLabelRow
			label={label || undefined}
			Info={Info}
			labelStyle={labelStyleMerged}
		>
			<RadioButton
				value={opt.key}
				onPress={onPress}
				status={status}
			/>
		</InfoLabelRow>
	);
};

export default InfoRadioRow;
