/**
 * External dependencies
 */
import { ReactNode, useMemo } from 'react';
import { TextProps, View, ViewProps } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import ButtonHighlightMenuControl from '../wrapper/ButtonHighlightMenuControl';
import { OptionBase } from '../../../types';

const OptionMenuRowControl = ({
	label,
	Info,
	options,
	value,
	onUpdate,
	style,
	labelStyle,
	anchorStyle,
	compact = false,
}: {
	label?: string;
	Info?: ReactNode | string;
	options: OptionBase[];
	value?: string;
	onUpdate: (newValue: string) => void;
	style?: ViewProps['style'];
	labelStyle?: TextProps['style'];
	anchorStyle?: ViewProps['style'];
	compact?: boolean;
}) => {
	const { t } = useTranslation();

	const anchorLabel = useMemo(() => {
		const currentOption = options.find((opt) => opt.key === value);
		return t(currentOption?.label ?? value ?? '');
	}, [options, value, t]);

	return (
		<InfoLabelRow
			label={label}
			Info={Info}
			style={style}
			labelStyle={labelStyle}
		>
			<View style={anchorStyle}>
				<ButtonHighlightMenuControl
					options={options}
					value={value}
					setValue={onUpdate}
					anchorLabel={anchorLabel}
					compact={compact}
				/>
			</View>
		</InfoLabelRow>
	);
};

export default OptionMenuRowControl;
