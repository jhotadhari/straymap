
/**
 * External dependencies
 */
import { Text, useTheme } from "react-native-paper";
import { useWindowDimensions, View, ViewStyle } from "react-native";

/**
 * Internal dependencies
 */
import ModalWrapper from "./generic/ModalWrapper";
import AnimatedLogo from "./AnimatedLogo";
import { modalWidthFactor } from "../constants";
import { ReactNode } from "react";

const SplashScreen = ( {
    displayLogo = true,
    children,
    innerStyle,
} : {
    displayLogo?: boolean;
    children?: ReactNode;
    innerStyle?: ViewStyle | null;
} ) => {

    const theme = useTheme();
    const { width, height } = useWindowDimensions();

    return <ModalWrapper
        visible={ true }
        onDismiss={ () => null }
        header={ '' }
        innerContainerStyle={ {
            borderWidth: 0,
            borderColor: undefined,
        } }
        innerStyle={ {
            justifyContent: 'center',
            alignItems: 'center',
            height: height * 0.75 - 2 * 20,
            ...( innerStyle || {} ),
        } }
    >

        <Text style={ { ...theme.fonts.displayMedium, fontFamily: 'jangly_walk' } }>
            { 'Straymap' }
        </Text>

        <View style={ { marginTop: 20 } }>

            { displayLogo && <AnimatedLogo
                animateLoop={ true }
                size={ width * modalWidthFactor }
            /> }

            { children && children }

        </View>

    </ModalWrapper>;
};

export default SplashScreen;