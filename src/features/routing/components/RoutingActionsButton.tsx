/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Icon } from 'react-native-paper';
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

/**
 * Internal dependencies
 */
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { MenuActionOption } from '../../../types';

const AnchorIcon: IconSource = ({ color }) => (
	<Icon
		source="menu"
		size={20}
		color={color}
	/>
);

const RoutingActionsButton: FC<{
	disabled?: boolean;
	actions?: Record<string, MenuActionOption>;
}> = ({ disabled, actions }) => {
	const options: MenuActionOption[] = useMemo(() => Object.values(actions || []), [actions]);

	return (
		<ButtonHighlightMenuControl
			options={options}
			anchorIcon={AnchorIcon}
			buttonPropsProps={{ mode: 'outlined', disabled }}
		/>
	);
};

export default RoutingActionsButton;
