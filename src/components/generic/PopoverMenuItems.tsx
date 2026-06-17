import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

import { MenuActionOption } from '../../types';
import MenuItem from './MenuItem';

const PopoverMenuItems: FC<{
	options: MenuActionOption[];
	onPress?: () => void;
}> = ({ options, onPress }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	return options.map((opt) => {
		const disabled = opt?.disabled ? opt?.disabled() : false;
		return (
			<MenuItem
				key={opt.key}
				leadingIcon={opt?.leadingIcon}
				onPress={() => {
					opt.cb();
					onPress && onPress();
				}}
				title={t(opt.label)}
				style={disabled ? { backgroundColor: theme.colors.surfaceDisabled } : undefined}
				textStyle={disabled ? { color: theme.colors.onSurfaceDisabled } : undefined}
				iconColor={disabled ? theme.colors.onSurfaceDisabled : undefined}
			/>
		);
	});
};

export default PopoverMenuItems;
