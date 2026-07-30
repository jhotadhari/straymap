/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Icon } from 'react-native-paper';
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { Props as ButtonPropsPaper } from 'react-native-paper/lib/typescript/components/Button/Button';

/**
 * Internal dependencies
 */
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { MenuActionOption } from '../../../types';
import { ButtonPropsProps } from '../../../compose/useButtonProps';

const AnchorIcon: IconSource = ({ color }) => (
	<Icon
		source="menu"
		size={20}
		color={color}
	/>
);

const RoutingActionsButton: FC<{
	disabled?: boolean;
	compact?: boolean;
	buttonPropsProps?: ButtonPropsProps;
	actions?: Record<string, MenuActionOption>;
}> = ({ disabled, compact, buttonPropsProps: buttonPropsProps_, actions }) => {
	const options: MenuActionOption[] = useMemo(() => Object.values(actions || []), [actions]);
	const buttonPropsProps: ButtonPropsProps = useMemo(
		() => ({
			...(buttonPropsProps_ ?? {}),
			mode: 'outlined',
			disabled,
		}),
		[buttonPropsProps_]
	);
	return (
		<ButtonHighlightMenuControl
			options={options}
			anchorIconNested={AnchorIcon}
			buttonPropsProps={buttonPropsProps}
			compact={compact}
		/>
	);
};

export default RoutingActionsButton;
