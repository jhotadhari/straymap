
/**
 * External dependencies
 */
import React, {
	ReactNode,
    useContext,
} from 'react';
import {
	useWindowDimensions,
	View,
    Pressable,
    StyleSheet,
    ViewStyle,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import {
	useTheme,
    Text,
    Portal,
    Modal,
} from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import { AppContext } from '../Context';

const styles = StyleSheet.create( {
    absolute: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      }
} );

const ModalWrapper = ( {
    children,
    visible,
    onDismiss,
    header,
    headerPrepend,
    innerStyle,
    backgroundBlur = true,
} : {
    children?: ReactNode;
    visible: boolean;
    onDismiss: () => void;
    header: string;
    headerPrepend?: string | ReactNode;
    innerStyle?: null | ViewStyle;
    backgroundBlur?: boolean,
} ) => {
	const { width, height } = useWindowDimensions();
    const theme = useTheme();
    const context = useContext( AppContext );
    return <Portal><AppContext.Provider value={ context } >
        <Modal
            theme={ backgroundBlur ? theme : { colors: {
                ...theme.colors,
                backdrop: 'transparent',
            } } }
            onDismiss={ onDismiss }
            visible={ visible }
            style={ { opacity: 1 } }
            contentContainerStyle={ {
                width,
                height,
                justifyContent: 'center',
                alignItems: 'center',
                // ,
            } }
        >
            <Pressable
                style={ styles.absolute }
                onPress={ onDismiss }
            >
                { backgroundBlur && <BlurView
                    style={ styles.absolute }
                    blurAmount={ 1 }
                    blurType={ theme.dark ? 'dark' : 'light' }
                /> }
            </Pressable>

            <KeyboardAvoidingView behavior="height" >
                <ScrollView
                    style={ {
                        backgroundColor: theme.colors.background,
                        width: width * 0.8,
                        maxHeight: height * 0.75,
                        padding: 20,
                        borderColor: theme.colors.outline,
                        borderWidth: 1,
                        borderRadius: theme.roundness,
                    } }
                >

                    <View style={ { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } }>
                        { headerPrepend && 'string' === typeof headerPrepend && <Text>{ headerPrepend }</Text> }
                        { headerPrepend && 'string' !== typeof headerPrepend && headerPrepend }
                        { header && <Text style={ theme.fonts.headlineSmall } >{ header }</Text> }
                    </View>

                    <View style={ innerStyle } >
                        { children }
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

        </Modal>
    </AppContext.Provider></Portal>;
};

export default ModalWrapper;