/**
 * External dependencies
 */
import React, { Dispatch, FC, RefObject, SetStateAction, useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import MenuItem from '../../../components/generic/wrapper/MenuItem';
import { POPOVER_MENU_ITEM_ICON_SIZE } from '../../../constants';
import { MenuActionOption } from '../../../types';

const arrowSize = { height: 0, width: 0 };

const BottomDrawerMenu: FC<{
	visible: boolean;
	setVisible: Dispatch<SetStateAction<boolean>>;
	from: RefObject<View | null>;
	options: MenuActionOption[];
	activeKey?: string;
}> = ({ visible, setVisible, from, options, activeKey }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 180,
		}),
		[theme]
	);

	const handleRequestClose = useCallback(() => setVisible(false), [setVisible]);

	const handleOptionPress = useCallback(
		(opt: MenuActionOption) => {
			opt.cb?.();
			setVisible(false);
		},
		[setVisible]
	);

	return (
		<Popover
			isVisible={visible}
			onRequestClose={handleRequestClose}
			from={from as any}
			placement={PopoverPlacement.TOP}
			popoverStyle={popoverStyle}
			arrowSize={arrowSize}
		>
			<View>
				<ScrollView>
					{options.map((opt) => (
						<MenuItem
							key={opt.key}
							title={t(opt.label)}
							leadingIcon={opt.leadingIcon}
							IconComponent={opt.IconComponent}
							iconSize={POPOVER_MENU_ITEM_ICON_SIZE}
							active={opt.key === activeKey}
							onPress={() => handleOptionPress(opt)}
						/>
					))}
				</ScrollView>
			</View>
		</Popover>
	);
};

export default BottomDrawerMenu;
