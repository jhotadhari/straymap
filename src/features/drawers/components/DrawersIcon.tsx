/**
 * External dependencies
 */
import { FC } from 'react';
import { TextStyle } from 'react-native';
import FeatherIcons from '@react-native-vector-icons/feather/static';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { DRAWER_ICON_SIZE } from '../constants';

const DrawersIcon: FC<{ color?: TextStyle['color']; style?: ListStyle; size?: number }> = ({
	color,
	style,
	size = DRAWER_ICON_SIZE,
}) => (
	<FeatherIcons
		name="sidebar"
		size={size}
		color={color}
		style={style}
	/>
);

export default DrawersIcon;
