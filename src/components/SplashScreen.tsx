/**
 * External dependencies
 */
import { Text, useTheme } from 'react-native-paper';
import { Dimensions, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

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

	return (
		<ModalWrapper
			visible={true}
			onDismiss={() => null}
			header={''}
			innerContainerStyle={{
				borderWidth: 0,
				borderColor: undefined,
			}}
			innerStyle={{
				justifyContent: 'flex-start',
				alignItems: 'center',
				height: height * 0.75 - 2 * 20,
				...(innerStyle || {}),
			}}
			scrollEnabled={displayLogo && !children}
			hasBackButton={false}
		>
			<Text
				style={{
					...theme.fonts.displayMedium,
					fontFamily: 'jangly_walk',
					marginBottom: 16,
				}}
			>
				{'Straymap'}
			</Text>

			{displayLogo && (
				<View
					style={{
						justifyContent: 'center',
						flexGrow: 1,
					}}
				>
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

export default SplashScreen;
