/**
 * Paper Button wrapper that adds a press-in/press-out background highlight.
 *
 * Usually used together with `useButtonProps` to have a consistent button
 * appearance (mode, colors, nestedIconColor) throughout the app:
 *
 *   const { nestedIconColor, ...buttonProps } = useButtonProps({ mode: 'text' });
 *   <ButtonHighlight {...buttonProps} compact onPress={...}>
 *     ...
 *   </ButtonHighlight>
 */

/**
 * External dependencies
 */
import { Props as ButtonProps } from 'react-native-paper/lib/typescript/components/Button/Button';
import { useTheme, Button } from 'react-native-paper';
import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent } from 'react-native';

const ButtonHighlight = memo(forwardRef((props: ButtonProps, ref: React.ForwardedRef<any>) => {
	const [pressing, setPressing] = useState(false);
	const theme = useTheme();
	const { onPress, onPressIn, onPressOut, style, disabled, children, ...restProps } = props;

	const handlePressIn = useCallback(
		(e: GestureResponderEvent) => {
			setPressing(true);
			onPressIn ? onPressIn(e) : null;
		},
		[onPressIn]
	);

	const handlePressOut = useCallback(
		(e: GestureResponderEvent) => {
			setPressing(false);
			onPressOut ? onPressOut(e) : null;
		},
		[onPressOut]
	);

	const styleMerged = useMemo(
		() => [
			style,
			pressing ? { backgroundColor: theme.colors.elevation.level3 } : undefined,
		],
		[
			style,
			pressing,
			theme,
		]
	);

	return (
		<Button
			{...restProps}
			ref={ref}
			disabled={disabled}
			onPress={disabled ? undefined : onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={styleMerged}
		>
			{children}
		</Button>
	);
}));

export default ButtonHighlight;
