/**
 * External dependencies
 */
import React, { FC, Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Popover from 'react-native-popover-view';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../store/hooks';
import { MenuActionOption } from '../../../../types';
import { PALETTE_COLORS } from '../../../../constants';
import { setLinesColor } from '../../slice';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';

interface Props {
	label: string;
	actions: Record<string, MenuActionOption>;
	buttonProps: Omit<ReturnType<typeof useButtonProps>, 'nestedIconColor'>;
}

const LinesActionsButton: FC<Props> = ({ actions, label, buttonProps }) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const theme = useTheme();

	const [menuVisible, setMenuVisible] = useState(false);
	const [colorPickerActive, setColorPickerActive] = useState(false);
	const buttonRef = useRef<View>(null);

	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
		setColorPickerActive(false);
	}, []);

	const handleButtonPress = useCallback(() => {
		setColorPickerActive(false);
		setMenuVisible(true);
	}, []);

	const handleSelectSetEqualColors = useCallback(() => {
		setColorPickerActive(true);
	}, []);

	const handleColorSelect = useCallback(
		(color: string) => {
			dispatch(setLinesColor(color));
			dismissMenu();
		},
		[dispatch, dismissMenu]
	);

	const actionOptions = useMemo(() => {
		const result: MenuActionOption[] = [];
		for (const key of Object.keys(actions)) {
			if (key === 'setEqualColors') {
				result.push({
					...actions[key],
					cb: handleSelectSetEqualColors,
				});
			} else {
				result.push(actions[key]);
			}
		}
		return result;
	}, [actions, handleSelectSetEqualColors]);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
		}),
		[theme]
	);

	const actionModalNodes = useMemo(
		() =>
			Object.entries(actions)
				.filter(([, a]) => a.modalNode)
				.map(([key, a]) => <Fragment key={key}>{a.modalNode}</Fragment>),
		[actions]
	);

	return (
		<>
			{actionModalNodes}

			<View ref={buttonRef}>
				<ButtonHighlight
					{...buttonProps}
					compact={true}
					onPress={handleButtonPress}
				>
					{label}
				</ButtonHighlight>
			</View>

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
						{!colorPickerActive && (
							<View>
								{actionOptions.map((action) => (
									<MenuItem
										key={action.key}
										leadingIcon={action.leadingIcon}
										IconComponent={action.IconComponent}
										onPress={() => {
											action.cb();
											if (action.key !== 'setEqualColors') {
												dismissMenu();
											}
										}}
										title={t(action.label)}
									/>
								))}
							</View>
						)}
						{colorPickerActive && (
							<View>
								{PALETTE_COLORS.map((palette) => (
									<MenuItem
										key={palette.bg}
										style={{
											backgroundColor: palette.bg as `#${string}`,
										}}
										textStyle={styles.colorTextStyle}
										title={' '}
										onPress={() => handleColorSelect(palette.bg)}
									/>
								))}
							</View>
						)}
					</ScrollView>
				</Popover>
			)}
		</>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

const styles = StyleSheet.create({
	colorTextStyle: {
		width: 40,
	},
});

export default LinesActionsButton;
