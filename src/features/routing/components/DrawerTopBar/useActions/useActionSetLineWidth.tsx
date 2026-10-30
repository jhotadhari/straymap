/**
 * External dependencies
 */
import { ElementType, useMemo } from 'react';
import { TextStyle } from 'react-native';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';

const LineWidthIcon = (({
	color,
	size,
}: {
	color?: TextStyle['color'];
	size?: number;
}) => (
	<LucideIcons
		size={size ?? 20}
		color={color}
		name="move-horizontal"
	/>
)) as ElementType<{
	color?: TextStyle['color'];
	size?: number;
}>;

const useActionSetLineWidth = (): MenuActionOption => {
	return useMemo(
		() => ({
			key: 'setLineWidth',
			cb: () => undefined,
			label: 'routing.setLineWidth',
			IconComponent: LineWidthIcon,
		}),
		[]
	);
};

export default useActionSetLineWidth;
