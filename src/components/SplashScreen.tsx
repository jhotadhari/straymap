/**
 * External dependencies
 */
import { Text, useTheme } from 'react-native-paper';
import { Dimensions, StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { memo, ReactNode, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ModalWrapper from './generic/wrapper/ModalWrapper';
import AnimatedLogo from './AnimatedLogo';
import { MODAL_WIDTH_FACTOR } from '../constants';

const SplashScreen = ({
	displayLogo = true,
	children,
	innerStyle,
}: {
	displayLogo?: boolean;
	children?: ReactNode;
	innerStyle?: StyleProp<ViewStyle>;
}) => {
	const theme = useTheme();
	const { width } = Dimensions.get('window');

	const styleInner = useMemo(
		() => [
			styles.innerStyle,
			{ flex: 1 },
			innerStyle,
		],
		[innerStyle]
	);

	const styleTitle = useMemo(() => [theme.fonts.displayMedium, styles.title], [theme]);

	return (
		<ModalWrapper
			visible={true}
			onDismiss={() => null}
			headerLabel={''}
			innerContainerStyle={styles.innerContainerStyle}
			innerStyle={styleInner}
			scrollEnabled={displayLogo && !children}
			hasBackButton={false}
		>
			<Text style={styleTitle}>{'Straymap'}</Text>

			{displayLogo && (
				<View style={styles.logoWrapper}>
					<AnimatedLogo
						animateLoop={true}
						size={width * MODAL_WIDTH_FACTOR}
					/>
				</View>
			)}

			{children && !displayLogo && <View style={styles.childrenWrapper}>{children}</View>}
			{children && displayLogo && children}
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	title: {
		fontFamily: 'jangly_walk',
		marginBottom: 16,
	},
	logoWrapper: {
		justifyContent: 'center',
		flexGrow: 1,
	},
	childrenWrapper: {
		flex: 1,
		justifyContent: 'center',
	},
	innerContainerStyle: {
		borderWidth: 0,
		borderColor: undefined,
	},
	innerStyle: {
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
});

export default memo(SplashScreen);
