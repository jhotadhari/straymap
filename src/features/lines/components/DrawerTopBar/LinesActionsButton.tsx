/**
 * External dependencies
 */
import React, { FC, Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import Popover from 'react-native-popover-view';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { PALETTE_COLORS } from '../../../../constants';
import { setLinesColor, setLinesWidth } from '../../slice';
import { selectLineWidth } from '../../selectors';
import { DEFAULT_LINE_WIDTH } from '../../constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';
import LineWidthControl from '../../../../components/generic/controls/LineWidthControl';
import { LinesBulkActions } from './useActions';

interface Props {
	label: string;
	actions: LinesBulkActions;
	buttonProps: Omit<ReturnType<typeof useButtonProps>, 'nestedIconColor'>;
}

const LinesActionsButton: FC<Props> = ({ actions, label, buttonProps }) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();
	const theme = useTheme();
	const lineWidth = useAppSelector(selectLineWidth);

	const [menuVisible, setMenuVisible] = useState(false);
	const [colorPickerActive, setColorPickerActive] = useState(false);
	const [widthPickerActive, setWidthPickerActive] = useState(false);
	const buttonRef = useRef<View>(null);

	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
		setColorPickerActive(false);
		setWidthPickerActive(false);
	}, []);

	const handleButtonPress = useCallback(() => {
		setColorPickerActive(false);
		setWidthPickerActive(false);
		setMenuVisible(true);
	}, []);

	const handleSelectSetEqualColors = useCallback(() => {
		setColorPickerActive(true);
	}, []);

	const handleSelectSetLineWidth = useCallback(() => {
		setWidthPickerActive(true);
	}, []);

	const handleColorSelect = useCallback(
		(color: string) => {
			dispatch(setLinesColor(color, actions.ordinaryLineIds));
			dismissMenu();
		},
		[dispatch, actions.ordinaryLineIds, dismissMenu]
	);

	const handleWidthApply = useCallback(
		(width: number) => {
			dispatch(setLinesWidth(width));
			dismissMenu();
		},
		[dispatch, dismissMenu]
	);

	const ordinaryDisabled = actions.ordinaryCount === 0;

	const actionModalNodes = useMemo(
		() =>
			[actions.showStats, ...actions.ordinary]
				.filter((a) => a.modalNode)
				.map((a) => <Fragment key={a.key}>{a.modalNode}</Fragment>),
		[actions]
	);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
		}),
		[theme]
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
						{!colorPickerActive && !widthPickerActive && (
							<View>
								<MenuItem
									leadingIcon={actions.showStats.leadingIcon}
									IconComponent={actions.showStats.IconComponent}
									onPress={() => {
										actions.showStats.cb();
										dismissMenu();
									}}
									title={t(actions.showStats.label)}
								/>

								<Divider />

								<Text style={styles.heading}>
									{sprintf(t('lines.ordinaryRoutes'), actions.ordinaryCount)}
								</Text>

								{actions.ordinary.map((action) => (
									<MenuItem
										key={action.key}
										style={
											ordinaryDisabled
												? { backgroundColor: theme.colors.surfaceDisabled }
												: undefined
										}
										textStyle={
											ordinaryDisabled
												? { color: theme.colors.onSurfaceDisabled }
												: undefined
										}
										iconColor={
											ordinaryDisabled
												? theme.colors.onSurfaceDisabled
												: undefined
										}
										leadingIcon={action.leadingIcon}
										IconComponent={action.IconComponent}
										onPress={
											ordinaryDisabled
												? undefined
												: () => {
														if (action.key === 'setLineWidth') {
															handleSelectSetLineWidth();
														} else if (action.key === 'setEqualColors') {
															handleSelectSetEqualColors();
														} else {
															action.cb();
															dismissMenu();
														}
													}
										}
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

						{widthPickerActive && (
							<LineWidthControl
								value={lineWidth}
								defaultValue={DEFAULT_LINE_WIDTH}
								defaultSuffix={t('lines.lineWidthDefaultSuffix')}
								onApply={handleWidthApply}
							/>
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
	heading: {
		fontSize: 12,
		lineHeight: 16,
		fontWeight: '600',
		paddingHorizontal: 12,
		paddingVertical: 4,
		opacity: 0.7,
	},
	colorTextStyle: {
		width: 40,
	},
});

export default LinesActionsButton;
