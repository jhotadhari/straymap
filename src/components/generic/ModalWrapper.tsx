/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import {
	Pressable,
	StyleSheet,
	ViewStyle,
	TouchableHighlight,
	Keyboard,
	LayoutChangeEvent,
	Dimensions,
	View,
	ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme, Text, Portal, Modal, Icon } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import Animated, {
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { AppContext } from '../../Context';
import { modalWidthFactor } from '../../constants';
import useKeyboardShown from '../../compose/useKeyboardShown';

const styles = StyleSheet.create({
	absolute: {
		position: 'absolute',
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
	},
	modalBase: { opacity: 1 },
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
	innerStyle?: null | ViewStyle;
	innerContainerStyle?: null | ViewStyle;
	modalStyle?: null | ViewStyle;
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
	const { height: heightSafe } = useSafeAreaFrame();
	const { height, width } = Dimensions.get('window');

	const theme = useTheme();
	const context = useContext(AppContext);
	const keyboardShown = useKeyboardShown();

	const modalHeight = heightSafe * 0.75;
	const modalTop = (height - modalHeight) / 2;

	const heightShared = useSharedValue(modalHeight);
	const topShared = useSharedValue(modalTop);

	useEffect(() => {
		heightShared.value = withTiming(modalHeight + (keyboardShown ? modalTop / 4 : 0), {
			duration,
			easing: Easing.inOut(Easing.quad),
			reduceMotion: ReduceMotion.System,
		});
		topShared.value = withTiming(modalTop, {
			duration,
			easing: Easing.inOut(Easing.quad),
			reduceMotion: ReduceMotion.System,
		});
	}, [
		modalHeight,
		modalTop,
		keyboardShown,
	]);

	const modalAnimatedStyles = useAnimatedStyle(() => ({
		height: heightShared.value,
		transform: [{ translateY: topShared.value }],
	}));

	const contentContainerStyle: ViewStyle = useMemo(
		() => ({
			width,
			height,
			justifyContent: 'center',
			flexDirection: 'row',
			position: 'absolute',
		}),
		[width, height]
	);

	const modalStyles: ViewStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			width: width * modalWidthFactor,
			padding: 20,
			borderColor: theme.colors.outline,
			borderWidth: 1,
			borderRadius: theme.roundness,
			...innerContainerStyle,
		}),
		[
			theme,
			width,
			modalWidthFactor,
			innerContainerStyle,
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

	const styleModal = useMemo(() => [styles.modalBase, modalStyle], [modalStyle]);

	const styleBackButton = useMemo(
		() => [styles.backButton, { borderRadius: theme.roundness }],
		[theme]
	);

	const styleContentInner = useMemo(() => [styles.contentInner, innerStyle], [innerStyle]);

	return (
		<Portal>
			<AppContext.Provider value={context}>
				<Modal
					theme={
						backgroundBlur
							? theme
							: {
									colors: {
										...theme.colors,
										backdrop: 'transparent',
									},
								}
					}
					onDismiss={handleDismissAll}
					visible={visible}
					style={styleModal}
					contentContainerStyle={contentContainerStyle}
				>
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

					<View style={contentContainerStyle}>
						<Animated.View style={modalAnimatedStyles}>
							<GestureHandlerRootView>
								<ScrollView
									scrollEnabled={scrollEnabled}
									onLayout={onLayout}
									style={[
										modalStyles,
										// {
										// 	height: modalHeight,
										// },
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
												{/* {header.split('-').map((str, index) => (
													<Text
														key={index}
														style={theme.fonts.headlineSmall}
													>
														{str +
															(index < header.split('-').length - 1
																? '-'
																: '')}
													</Text>
												))} */}
												<Text style={theme.fonts.headlineSmall}>
													{header}
												</Text>
											</View>
										)}
									</View>

									<View style={styleContentInner}>{children}</View>
								</ScrollView>
							</GestureHandlerRootView>
						</Animated.View>
					</View>
				</Modal>
			</AppContext.Provider>
		</Portal>
	);
};

export default ModalWrapper;
