/**
 * Internal dependencies
 */

import { TextStyle } from 'react-native';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';

const IconComponent: FC<{ color?: TextStyle['color'] }> = ({ color }) => (
	<IconFontGis
		name="polyline-pt"
		size={25}
		style={{ color }}
	/>
);

export default IconComponent;
