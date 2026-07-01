/**
 * External dependencies
 */
import { Props as ButtonProps } from 'react-native-paper/lib/typescript/components/Button/Button';
import { useTheme, Button } from 'react-native-paper';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent } from 'react-native';

const ButtonHighlight = forwardRef((props: ButtonProps, ref: React.ForwardedRef<any>) => {
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
		() => ({
			...(style && 'object' === typeof style && style),
			...(pressing && { backgroundColor: theme.colors.elevation.level3 }),
		}),
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
});

export default ButtonHighlight;
