/**
 * External dependencies
 */
import React, { FC, Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, Icon, useTheme } from 'react-native-paper';
import Popover from 'react-native-popover-view';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../types';
import { ButtonPropsProps, useButtonProps } from '../../../compose/useButtonProps';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import MenuItem from '../../../components/generic/wrapper/MenuItem';
import LineWidthControl from '../../../components/generic/controls/LineWidthControl';
import { setLineWidth } from '../slice';
import { selectLineWidth } from '../selectors';
import { DEFAULT_ROUTING_LINE_WIDTH } from '../constants';

const RoutingActionsButton: FC<{
	disabled?: boolean;
	compact?: boolean;
	buttonPropsProps?: ButtonPropsProps;
	actions?: Record<string, MenuActionOption>;
}> = ({ disabled, compact, buttonPropsProps: buttonPropsProps_, actions }) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const theme = useTheme();
	const lineWidth = useAppSelector(selectLineWidth);

	const [menuVisible, setMenuVisible] = useState(false);
	const [widthPickerActive, setWidthPickerActive] = useState(false);
	const buttonRef = useRef<View>(null);

	const { nestedIconColor, ...buttonProps } = useButtonProps({
		...(buttonPropsProps_ ?? {}),
		mode: 'outlined',
		disabled,
	});

	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
		setWidthPickerActive(false);
	}, []);

	const handleAnchorPress = useCallback(() => {
		setWidthPickerActive(false);
		setMenuVisible(true);
	}, []);

	const handleWidthApply = useCallback(
		(width: number) => {
			dispatch(setLineWidth(width));
			dismissMenu();
		},
		[dispatch, dismissMenu]
	);

	const options = useMemo(() => Object.values(actions || []), [actions]);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 100,
		}),
		[theme]
	);

	return (
		<View ref={buttonRef}>
			<ButtonHighlight
				{...buttonProps}
				compact={compact}
				onPress={handleAnchorPress}
			>
				<Icon
					source="menu"
					size={20}
					color={nestedIconColor}
				/>
			</ButtonHighlight>

			{buttonRef.current && menuVisible && (
				<Popover
					popoverStyle={popoverStyle}
					arrowSize={arrowSize}
					isVisible={menuVisible}
					onRequestClose={dismissMenu}
					from={buttonRef as React.RefObject<React.Component<{}, {}, any>>}
					animationConfig={animationConfig}
				>
					<ScrollView>
						{!widthPickerActive &&
							options.map((opt) => {
								const isSetLineWidth = opt.key === 'setLineWidth';
								const isDisabled = opt.disabled?.() ?? false;
								return (
									<Fragment key={opt.key}>
										{isSetLineWidth && <Divider />}
										<MenuItem
											style={
												isDisabled
													? { backgroundColor: theme.colors.surfaceDisabled }
													: undefined
											}
											textStyle={
												isDisabled
													? { color: theme.colors.onSurfaceDisabled }
													: undefined
											}
											iconColor={
												isDisabled
													? theme.colors.onSurfaceDisabled
													: undefined
											}
											leadingIcon={opt.leadingIcon}
											IconComponent={opt.IconComponent}
											onPress={
												isDisabled
													? undefined
													: () => {
															if (isSetLineWidth) {
																setWidthPickerActive(true);
															} else {
																opt.cb();
																dismissMenu();
															}
														}
											}
											title={t(opt.label)}
										/>
									</Fragment>
								);
							})}

						{widthPickerActive && (
							<LineWidthControl
								value={lineWidth}
								defaultValue={DEFAULT_ROUTING_LINE_WIDTH}
								defaultSuffix={t('routing.lineWidthDefaultSuffix')}
								onApply={handleWidthApply}
							/>
						)}
					</ScrollView>
				</Popover>
			)}
		</View>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

export default RoutingActionsButton;
