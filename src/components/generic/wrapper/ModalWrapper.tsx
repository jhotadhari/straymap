/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	Pressable,
	StyleSheet,
	StyleProp,
	ViewStyle,
	TouchableHighlight,
	Keyboard,
	LayoutChangeEvent,
	Dimensions,
	View,
	ScrollView,
	Modal as RNModal,
	StatusBar,
} from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../Context';
import { MODAL_WIDTH_FACTOR, MODAL_PADDING, OPACITY_DISABLED } from '../../../constants';
import { sharedStyles } from '../../../sharedStyles';

const styles = StyleSheet.create({
	flex1: { flex: 1 },
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
		justifyContent: 'flex-start',
	},
	headerLabel: {
		flexShrink: 1,
	},
	backButton: { padding: 4 },
	contentInner: { paddingBottom: 6 * 8 },
});

const ModalWrapper: FC<{
	children?: ReactNode;
	visible: boolean;
	hasBackButton?: boolean;
	dismissDisabled?: boolean;
	onDismiss: () => void;
	headerLabel: string;
	innerStyle?: StyleProp<ViewStyle>;
	innerContainerStyle?: StyleProp<ViewStyle>;
	modalStyle?: StyleProp<ViewStyle>;
	backgroundBlur?: boolean;
	scrollEnabled?: boolean;
	onLayout?: (event: LayoutChangeEvent) => void;
}> = ({
	children,
	visible,
	hasBackButton = true,
	dismissDisabled = false,
	onDismiss,
	headerLabel,
	innerStyle,
	innerContainerStyle,
	modalStyle,
	backgroundBlur = true,
	scrollEnabled = true,
	onLayout,
}) => {
	// `screen.height` is the full physical screen (consistent across devices).
	// `window.height` varies by OEM — use screen for all math, subtract the
	// status bar explicitly to get the usable area (`windowH`).
	const { height: screenH, width } = Dimensions.get('screen');
	const statusBarHeight = StatusBar.currentHeight ?? 0;
	const windowH = screenH - statusBarHeight;

	const theme = useTheme();
	const context = useContext(AppContext);

	// Track the keyboard's top edge from `endCoordinates.screenY` — this is
	// the Y coordinate of the keyboard's top in screen space.  It is more
	// reliable than `height` because it directly tells us the available
	// vertical space regardless of how the OEM reports keyboard dimensions.
	const [keyboardScreenY, setKeyboardScreenY] = useState(0);
	const [keyboardShown, setKeyboardShown] = useState(false);
	useEffect(() => {
		const s = Keyboard.addListener('keyboardDidShow', (e) => {
			setKeyboardScreenY(e.endCoordinates.screenY);
			setKeyboardShown(true);
		});
		const h = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardScreenY(0);
			setKeyboardShown(false);
		});
		return () => {
			s.remove();
			h.remove();
		};
	}, [
		screenH,
		windowH,
		statusBarHeight,
	]);

	// Fixed height when keyboard is hidden — keeps stacked modals visually
	// consistent so it feels like the content changed, not a new modal.
	const modalHeight = windowH * 0.75;

	// When there's no keyboard the modal is absolutely-positioned at
	// `yogaTop` (centered in the window below the status bar).
	const yogaTop = statusBarHeight + (windowH - modalHeight) / 2;

	const heightShared = useSharedValue(modalHeight);
	const topShared = useSharedValue(yogaTop);

	useEffect(() => {
		if (keyboardScreenY > 0) {
			const visibleH = keyboardScreenY - statusBarHeight;
			const bottomGap = 0;
			const heightSlack = 4;
			const targetHeight = Math.max(windowH * 0.35, visibleH - heightSlack);
			// Position the top edge so the bottom edge sits exactly at
			// keyboardScreenY - bottomGap.
			const targetTop = keyboardScreenY - bottomGap - targetHeight;
			heightShared.value = withTiming(targetHeight, {
				duration: 200,
				easing: Easing.inOut(Easing.quad),
				reduceMotion: ReduceMotion.System,
			});
			topShared.value = withTiming(targetTop, {
				duration: 200,
				easing: Easing.inOut(Easing.quad),
				reduceMotion: ReduceMotion.System,
			});
		} else {
			heightShared.value = withTiming(modalHeight, {
				duration: 200,
				easing: Easing.inOut(Easing.quad),
				reduceMotion: ReduceMotion.System,
			});
			topShared.value = withTiming(yogaTop, {
				duration: 200,
				easing: Easing.inOut(Easing.quad),
				reduceMotion: ReduceMotion.System,
			});
		}
	}, [
		keyboardScreenY,
		windowH,
		statusBarHeight,
		modalHeight,
		yogaTop,
		heightShared,
		topShared,
	]);

	const modalAnimatedStyles = useAnimatedStyle(() => ({
		height: heightShared.value,
		top: topShared.value,
	}));

	const modalStyles: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			width: width * MODAL_WIDTH_FACTOR,
			padding: MODAL_PADDING,
			borderColor: theme.colors.outline,
			borderWidth: 1,
			borderRadius: theme.roundness,
		}),
		[
			theme,
			width,
		]
	);

	const handleDismissAll = useCallback(() => {
		if (dismissDisabled) {
			return;
		}
		onDismiss();
		Keyboard.dismiss();
	}, [onDismiss, dismissDisabled]);

	const handleDismiss = useCallback(() => {
		if (dismissDisabled) {
			return;
		}
		if (keyboardShown) {
			Keyboard.dismiss();
		} else {
			onDismiss();
		}
	}, [
		onDismiss,
		keyboardShown,
		dismissDisabled,
	]);

	const styleBackButton = useMemo(
		() => [
			styles.backButton,
			{ borderRadius: theme.roundness },
			dismissDisabled ? { opacity: OPACITY_DISABLED } : undefined,
		],
		[theme, dismissDisabled]
	);

	const styleContent = useMemo(
		() => [sharedStyles.absolute, { paddingTop: statusBarHeight }],
		[statusBarHeight]
	);

	// Horizontal center for the absolutely-positioned modal.
	const modalLeft = (width - width * MODAL_WIDTH_FACTOR) / 2;

	const styleContentInner = useMemo(() => [styles.contentInner, innerStyle], [innerStyle]);

	return (
		<RNModal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={handleDismissAll}
			statusBarTranslucent
		>
			<GestureHandlerRootView style={styles.flex1}>
				<AppContext.Provider value={context}>
					{/* Backdrop — fills the modal window */}
					<Pressable
						style={sharedStyles.absolute}
						onPress={handleDismiss}
					>
						{backgroundBlur && (
							<BlurView
								style={sharedStyles.absolute}
								blurAmount={1}
								blurType={theme.dark ? 'dark' : 'light'}
							/>
						)}
					</Pressable>

					{/* Content — fills the modal window, centers its child */}
					<View style={styleContent}>
						<Animated.View
							style={[
								// eslint-disable-next-line react-native/no-inline-styles
								{
									position: 'absolute',
									left: modalLeft,
									width: width * MODAL_WIDTH_FACTOR,
								},
								modalAnimatedStyles,
							]}
						>
							<ScrollView
								scrollEnabled={scrollEnabled}
								onLayout={onLayout}
								style={[
									modalStyles,
									innerContainerStyle,
									modalStyle,
								]}
								keyboardShouldPersistTaps="handled"
							>
								<View style={styles.headerRow}>
									{hasBackButton && (
										<TouchableHighlight
											underlayColor={theme.colors.elevation.level3}
											style={styleBackButton}
											onPress={handleDismiss}
											disabled={dismissDisabled}
										>
											<Icon
												source="arrow-left"
												size={25}
											/>
										</TouchableHighlight>
									)}

									{headerLabel && (
										<View style={styles.headerLabel}>
											<Text style={theme.fonts.headlineSmall}>
												{headerLabel}
											</Text>
										</View>
									)}
								</View>

								<View style={styleContentInner}>{children}</View>
							</ScrollView>
						</Animated.View>
					</View>
				</AppContext.Provider>
			</GestureHandlerRootView>
		</RNModal>
	);
};

export default ModalWrapper;
