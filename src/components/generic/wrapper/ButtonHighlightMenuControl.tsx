/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { ButtonPropsProps, useButtonProps } from '../../../compose/useButtonProps';
import ButtonHighlight from '../primitives/ButtonHighlight';
import MenuControl, { MenuControlProps } from '../primitives/MenuControl';

interface Props extends Omit<MenuControlProps, 'AnchorComponent'> {
	anchorLabel?: string;
	anchorIcon?: string;
	compact?: boolean;
	buttonPropsProps?: ButtonPropsProps;
}

const ButtonHighlightMenuControl: FC<Props> = ({
	menuItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorIcon,
	compact,
	buttonPropsProps,
}) => {
	const { nestedIconColor, ...buttonProps } = useButtonProps(buttonPropsProps ?? {});

	const AnchorComponent = useMemo(() => {
		return ({ onPress }: { onPress: () => void }) => (
			<ButtonHighlight
				{...buttonProps}
				compact={compact}
				onPress={onPress}
			>
				{anchorIcon ? (
					<Icon
						source={anchorIcon}
						size={25}
						color={nestedIconColor}
					/>
				) : null}
				{anchorLabel}
			</ButtonHighlight>
		);
	}, [
		buttonProps,
		compact,
		anchorIcon,
		anchorLabel,
		nestedIconColor,
	]);

	return (
		<MenuControl
			AnchorComponent={AnchorComponent}
			menuItemStyle={menuItemStyle}
			options={options}
			value={value}
			setValue={setValue}
		/>
	);
};

export default ButtonHighlightMenuControl;
