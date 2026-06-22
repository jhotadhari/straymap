/**
 * External dependencies
 */
import { Text, useTheme } from 'react-native-paper';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import { ReactNode, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ModalWrapper from './generic/ModalWrapper';
import AnimatedLogo from './AnimatedLogo';
import { modalWidthFactor } from '../constants';

const SplashScreen = ({
	displayLogo = true,
	children,
	innerStyle,
}: {
	displayLogo?: boolean;
	children?: ReactNode;
	innerStyle?: ViewStyle;
}) => {
	const theme = useTheme();
	const { width, height } = Dimensions.get('window');

	// ModalWrapper spreads innerStyle/innerContainerStyle internally, so these must stay plain objects.
	const innerStyleCombined = useMemo(
		() => ({
			justifyContent: 'flex-start' as const,
			alignItems: 'center' as const,
			height: height * 0.75 - 2 * 20,
			...(innerStyle || {}),
		}),
		[height, innerStyle]
	);

	const styleTitle = useMemo(() => [theme.fonts.displayMedium, styles.title], [theme]);

	return (
		<ModalWrapper
			visible={true}
			onDismiss={() => null}
			header={''}
			innerContainerStyle={innerContainerStyle}
			innerStyle={innerStyleCombined}
			scrollEnabled={displayLogo && !children}
			hasBackButton={false}
		>
			<Text style={styleTitle}>{'Straymap'}</Text>

			{displayLogo && (
				<View style={styles.logoWrapper}>
					<AnimatedLogo
						animateLoop={true}
						size={width * modalWidthFactor}
					/>
				</View>
			)}

			{children && children}
		</ModalWrapper>
	);
};

// ModalWrapper spreads this internally, so it must stay a plain object (not StyleSheet.create).
const innerContainerStyle = {
	borderWidth: 0,
	borderColor: undefined,
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
});

export default SplashScreen;
