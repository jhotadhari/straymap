/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Icon } from 'react-native-paper';
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

/**
 * Internal dependencies
 */
import { ButtonPropsProps, useButtonProps } from '../../../compose/useButtonProps';
import ButtonHighlight from '../primitives/ButtonHighlight';
import MenuControl, { MenuControlProps } from '../primitives/MenuControl';

interface Props extends Omit<MenuControlProps, 'AnchorComponent'> {
	anchorLabel?: string;
	anchorIconNested?: IconSource;
	anchorIcon?: IconSource;
	compact?: boolean;
	buttonPropsProps?: ButtonPropsProps;
}

const ButtonHighlightMenuControl: FC<Props> = ({
	menuItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorIconNested,
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
				icon={anchorIcon}
			>
				{anchorIconNested && (
					<Icon
						source={anchorIconNested}
						size={25}
						color={nestedIconColor}
					/>
				)}
				{anchorLabel}
			</ButtonHighlight>
		);
	}, [
		buttonProps,
		compact,
		anchorIcon,
		anchorIconNested,
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
