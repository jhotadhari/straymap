/**
 * External dependencies
 */
import React, { ElementType, FC, useCallback, useMemo, useRef, useState } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { MenuActionOption, OptionBase } from '../../../types';
import MenuItem from '../wrapper/MenuItem';
import Popover from 'react-native-popover-view';

export interface MenuControlProps {
	AnchorComponent: ElementType<{
		onPress: () => void;
	}>;
	menuItemStyle?: ViewStyle | ((idx: number) => ViewStyle);
	options?: OptionBase[];
	value?: string;
	setValue?: (newValue: string) => void;
}

const MenuControl: FC<MenuControlProps> = ({
	menuItemStyle,
	options,
	value,
	setValue,
	AnchorComponent,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 100,
		}),
		[theme]
	);

	const handleRequestClose = useCallback(() => setVisible(false), []);

	const handleAnchorPress = useCallback(() => setVisible((isVisible) => !isVisible), []);

	const handleOptionPress = useCallback(
		(opt: OptionBase) => {
			const actionOpt = opt as MenuActionOption;
			if (actionOpt.cb) {
				actionOpt.cb();
			} else {
				setValue && setValue(opt.key);
			}
			setVisible(false);
		},
		[setValue]
	);

	const anchorRef = useRef<View>(null);

	return (
		<>
			<View ref={anchorRef}>
				<AnchorComponent onPress={handleAnchorPress} />
			</View>
			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={visible}
				onRequestClose={handleRequestClose}
				from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
			>
				{options && (
					<ScrollView>
						{options.map((opt, idx) => {
							const actionOpt = opt as MenuActionOption;
							const isDisabled = actionOpt.disabled?.() ?? false;
							const hasCb = !!actionOpt.cb;
							return (
								<MenuItem
									style={
										menuItemStyle instanceof Function
											? menuItemStyle(idx)
											: menuItemStyle
									}
									key={opt.key}
									onPress={isDisabled ? undefined : () => handleOptionPress(opt)}
									title={t(opt.label)}
									active={!hasCb && opt.key === value}
									leadingIcon={actionOpt.leadingIcon}
									IconComponent={actionOpt.IconComponent}
								/>
							);
						})}
					</ScrollView>
				)}
			</Popover>
		</>
	);
};

const arrowSize = { height: 0, width: 0 };

export default MenuControl;
