/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../types';
import MenuItem from './MenuItem';

const PopoverMenuItem: FC<{
	opt: MenuActionOption;
	onPress?: () => void;
}> = ({ opt, onPress }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const disabled = opt?.disabled ? opt?.disabled() : false;

	const handlePress = useCallback(() => {
		if (disabled) return;
		opt.cb();
		onPress && onPress();
	}, [
		opt,
		onPress,
		disabled,
	]);

	return (
		<MenuItem
			leadingIcon={opt?.leadingIcon}
			onPress={handlePress}
			title={t(opt.label)}
			style={disabled ? { backgroundColor: theme.colors.surfaceDisabled } : undefined}
			textStyle={disabled ? { color: theme.colors.onSurfaceDisabled } : undefined}
			iconColor={disabled ? theme.colors.onSurfaceDisabled : undefined}
		/>
	);
};

const PopoverMenuItems: FC<{
	options: MenuActionOption[];
	onPress?: () => void;
}> = ({ options, onPress }) => {
	return options.map((opt) => (
		<PopoverMenuItem
			key={opt.key}
			opt={opt}
			onPress={onPress}
		/>
	));
};

export default PopoverMenuItems;
