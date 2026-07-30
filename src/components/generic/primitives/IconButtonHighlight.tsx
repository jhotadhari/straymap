/**
 * External dependencies
 */
import { useTheme, IconButton, IconButtonProps } from 'react-native-paper';
import { memo, useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent } from 'react-native';

const IconButtonHighlight = (
	props: IconButtonProps & {
		stylePressing?: IconButtonProps['style'];
	}
) => {
	const [pressing, setPressing] = useState(false);
	const theme = useTheme();
	const { onPressIn, onPressOut, style, stylePressing, ...restProps } = props;

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
			...(pressing
				? [
						{ backgroundColor: theme.colors.elevation.level3 },
						stylePressing,
					]
				: []),
		],
		[
			style,
			stylePressing,
			pressing,
			theme,
		]
	);

	return (
		<IconButton
			{...restProps}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={styleMerged}
		/>
	);
};

export default memo(IconButtonHighlight);
