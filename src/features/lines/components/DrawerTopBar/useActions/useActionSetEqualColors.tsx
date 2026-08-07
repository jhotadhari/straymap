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

const PaintbrushVerticalIcon = (({
	color,
	size,
}: {
	color?: TextStyle['color'];
	size?: number;
}) => (
	<LucideIcons size={size ?? 20} color={color} name="paintbrush-vertical" />
)) as ElementType<{
	color?: TextStyle['color'];
	size?: number;
}>;

const useActionSetEqualColors = (): MenuActionOption => {
	return useMemo(
		() => ({
			key: 'setEqualColors',
			cb: () => undefined,
			label: 'lines.setEqualColors',
			IconComponent: PaintbrushVerticalIcon,
		}),
		[]
	);
};

export default useActionSetEqualColors;
