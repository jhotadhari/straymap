/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ButtonHighlightMenuControl from '../../../components/generic/wrapper/ButtonHighlightMenuControl';
import { MenuActionOption } from '../../../types';

const RoutingActionsButton: FC<{
	disabled?: boolean;
	actions?: Record<string, MenuActionOption>;
}> = ({ disabled, actions }) => {
	const options: MenuActionOption[] = useMemo(() => Object.values(actions || []), [actions]);

	return (
		<ButtonHighlightMenuControl
			options={options}
			anchorIcon="menu"
			buttonPropsProps={{ mode: 'outlined', disabled }}
		/>
	);
};

export default RoutingActionsButton;
