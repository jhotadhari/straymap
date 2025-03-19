
/**
 * External dependencies
 */
import { Text, useTheme } from "react-native-paper";
import { useWindowDimensions } from "react-native";

/**
 * Internal dependencies
 */
import ModalWrapper from "./ModalWrapper";
import AnimatedLogo from "./AnimatedLogo";
import { modalWidthFactor } from "../constants";

const SplashScreen = () => {

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
        } }
    >

        <Text style={ theme.fonts.displayMedium }>
            { 'Straymap' }
        </Text>

        <AnimatedLogo
            animateLoop={ true }
            size={ width * modalWidthFactor }
        />

    </ModalWrapper>;
};

export default SplashScreen;