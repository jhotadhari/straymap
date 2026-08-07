/**
 * External dependencies
 */
import { ElementType, useCallback, useMemo } from 'react';
import { TextStyle } from 'react-native';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../../store/hooks';
import { randomizeLineColors } from '../../../slice';

const PaintbrushIcon = (({
	color,
	size,
}: {
	color?: TextStyle['color'];
	size?: number;
}) => <LucideIcons size={size ?? 20} color={color} name="paintbrush" />) as ElementType<{
	color?: TextStyle['color'];
	size?: number;
}>;

const useActionRandomizeColors = () => {
	const dispatch = useAppDispatch();

	const cb = useCallback(() => {
		dispatch(randomizeLineColors());
	}, [dispatch]);

	return useMemo(
		() => ({
			key: 'randomizeColors',
			cb,
			label: 'lines.randomizeColors',
			IconComponent: PaintbrushIcon,
		}),
		[cb]
	);
};

export default useActionRandomizeColors;
