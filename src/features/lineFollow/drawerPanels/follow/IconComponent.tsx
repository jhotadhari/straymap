/**
 * External dependencies
 */
import { FC } from 'react';
import { TextStyle } from 'react-native';

/**
 * Internal dependencies
 */
import IconFontGis from '../../../../components/generic/primitives/IconFontGis';

const IconComponent: FC<{ color?: TextStyle['color']; size?: number }> = ({ color, size = 25 }) => (
	<IconFontGis
		name="direct"
		size={size}
		style={{ color }}
	/>
);

export default IconComponent;
