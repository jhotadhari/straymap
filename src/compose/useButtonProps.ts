/**
 * External dependencies
 */
import { get } from 'lodash-es';
import { useMemo } from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Props as ButtonPropsPaper } from 'react-native-paper/lib/typescript/components/Button/Button';

export type ButtonPropsProps = {
	mode?: ButtonPropsPaper['mode'];
	style?: ButtonPropsPaper['style'];
	isDestructive?: boolean;
	isSuccess?: boolean;
	disabled?: boolean;
	paddingHorizontal?: boolean;
	textColor?: string;
	buttonColor?: string;
	alignWithIconButton?: boolean;
};

/**
 * Designed for use with ButtonHighlight to provide a consistent button
 * appearance throughout the app.  Returns all props needed by Paper's
 * Button component — mode, colors, styles — plus nestedIconColor for
 * `<Icon color={nestedIconColor} />` rendered inside the button.
 *
 * Default mode is `'outlined'`.  When `isDestructive` or `isSuccess`
 * is truthy, mode becomes `'contained'` with the corresponding theme
 * container colors.
 *
 * Usage:
 *   const { nestedIconColor, ...buttonProps } = useButtonProps({ isDestructive: true });
 *   <ButtonHighlight {...buttonProps} compact onPress={...}>
 *     <Icon source="delete" color={nestedIconColor} size={20} />
 *     {t('delete')}
 *   </ButtonHighlight>
 */
export const useButtonProps = ({
	mode: mode_,
	style: style_,
	isDestructive,
	isSuccess,
	disabled,
	paddingHorizontal,
	textColor: textColor_,
	buttonColor: buttonColor_,
	alignWithIconButton,
}: ButtonPropsProps) => {
	const theme = useTheme();

	const mode: undefined | ButtonPropsPaper['mode'] = useMemo(() => {
		if (mode_) {
			return mode_;
		} else if (isDestructive || isSuccess) {
			return 'contained';
		} else {
			return 'outlined';
		}
	}, [
		mode_,
		isDestructive,
		isSuccess,
	]);

	const style: undefined | ButtonPropsPaper['style'] = useMemo(() => {
		if ('outlined' === mode) {
			return [
				disabled
					? {
							borderColor: theme.colors.onSurfaceDisabled,
						}
					: undefined,
				style_,
			];
		}
		return style_;
	}, [
		theme,
		disabled,
		mode,
		style_,
	]);

	const contentStyle: undefined | StyleProp<ViewStyle> = useMemo(() => {
		return [
			paddingHorizontal ? styles.buttonContent : undefined,
			alignWithIconButton ? styles.itemBtnAlignFix : undefined,
		];
	}, [
		paddingHorizontal,
		alignWithIconButton,
	]);

	let labelStyle: undefined | StyleProp<TextStyle>;
	labelStyle = styles.buttonLabel;

	const textColor: string = useMemo(() => {
		if (textColor_) {
			return textColor_;
		} else if (isDestructive) {
			return theme.dark
				? theme.colors.onBackground
				: theme.colors.background;
		} else if (isSuccess) {
			return theme.dark
				? theme.colors.onBackground
				: theme.colors.background;
		} else {
			return theme.colors.onBackground;
		}
	}, [
		theme,
		textColor_,
		isSuccess,
		isDestructive,
	]);

	const buttonColor: undefined | string = useMemo(() => {
		if (buttonColor_) {
			return buttonColor_;
		} else if (isDestructive) {
			return theme.dark
				? theme.colors.errorContainer
				: theme.colors.error;
		} else if (isSuccess) {
			return theme.dark
				? get(theme.colors, 'successContainer')
				: get(theme.colors, 'success');
		} else {
			return undefined;
		}
	}, [
		theme,
		buttonColor_,
		isSuccess,
		isDestructive,
	]);

	const nestedIconColor: undefined | string = useMemo(() => {
		return disabled ? theme.colors.onSurfaceDisabled : theme.colors.onBackground;
	}, [
		theme,
		disabled,
	]);

	return {
		style,
		contentStyle,
		labelStyle,
		textColor,
		buttonColor,
		mode,
		disabled,
		nestedIconColor,
	};
};

const styles = StyleSheet.create({
	buttonContent: {
		paddingHorizontal: 8,
	},
	buttonLabel: {
		display: 'flex',
		flexDirection: 'row',
		flexGrow: 1,
	},
	itemBtnAlignFix: { marginVertical: -2 },
});
