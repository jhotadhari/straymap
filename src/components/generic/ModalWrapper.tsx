/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
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
import { AppContext } from '../../Context';
import { modalWidthFactor, modalPadding } from '../../constants';
import useKeyboardShown from '../../compose/useKeyboardShown';

const styles = StyleSheet.create({
	absolute: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},
	flex1: { flex: 1 },
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerRow: {
		width: '90%',
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
		justifyContent: 'flex-start',
	},
	backButton: { padding: 5 },
	contentInner: { paddingBottom: 50 },
});

const duration = 100;

const ModalWrapper: FC<{
	children?: ReactNode;
	visible: boolean;
	hasBackButton?: boolean;
	onDismiss: () => void;
	header: string;
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
	onDismiss,
	header,
	innerStyle,
	innerContainerStyle,
	modalStyle,
	backgroundBlur = true,
	scrollEnabled = true,
	onLayout,
}) => {
	const { height, width } = Dimensions.get('window');
	const statusBarHeight = StatusBar.currentHeight ?? 0;

	const theme = useTheme();
	const context = useContext(AppContext);
	const keyboardShown = useKeyboardShown();

	const modalHeight = height * 0.75;
	const modalTop = (height - modalHeight) / 2;

	const heightShared = useSharedValue(modalHeight);

	useEffect(() => {
		heightShared.value = withTiming(modalHeight + (keyboardShown ? modalTop / 4 : 0), {
			duration,
			easing: Easing.inOut(Easing.quad),
			reduceMotion: ReduceMotion.System,
		});
	}, [
		modalHeight,
		modalTop,
		keyboardShown,
		heightShared,
	]);

	const modalAnimatedStyles = useAnimatedStyle(() => ({
		height: heightShared.value,
	}));

	const modalStyles: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			width: width * modalWidthFactor,
			padding: modalPadding,
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
		onDismiss();
		Keyboard.dismiss();
	}, [onDismiss]);

	const handleDismiss = useCallback(() => {
		if (keyboardShown) {
			Keyboard.dismiss();
		} else {
			onDismiss();
		}
	}, [onDismiss, keyboardShown]);

	const styleBackButton = useMemo(
		() => [styles.backButton, { borderRadius: theme.roundness }],
		[theme]
	);

	const styleContent = useMemo(
		() => [
			styles.absolute,
			styles.centerContent,
			{ paddingTop: statusBarHeight },
		],
		[statusBarHeight]
	);

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
						style={styles.absolute}
						onPress={handleDismiss}
					>
						{backgroundBlur && (
							<BlurView
								style={styles.absolute}
								blurAmount={1}
								blurType={theme.dark ? 'dark' : 'light'}
							/>
						)}
					</Pressable>

					{/* Content — fills the modal window, centers its child */}
					<View style={styleContent}>
						<Animated.View
							style={[
								{ width: width * modalWidthFactor },
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
							>
								<View style={styles.headerRow}>
									{hasBackButton && (
										<TouchableHighlight
											underlayColor={theme.colors.elevation.level3}
											style={styleBackButton}
											onPress={handleDismiss}
										>
											<Icon
												source="arrow-left"
												size={25}
											/>
										</TouchableHighlight>
									)}

									{header && (
										<View>
											<Text style={theme.fonts.headlineSmall}>{header}</Text>
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
