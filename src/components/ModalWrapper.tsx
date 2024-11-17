
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
    TouchableHighlight,
    Keyboard,
} from 'react-native';
import {
	useTheme,
    Text,
    Portal,
    Modal,
    Icon,
} from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { modalWidthFactor } from '../constants';
import useKeyboardShown from '../compose/useKeyboardShown';

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
    onHeaderBackPress,
    header,
    headerPrepend,
    innerStyle,
    backgroundBlur = true,
} : {
    children?: ReactNode;
    visible: boolean;
    onDismiss: () => void;
    onHeaderBackPress?: () => void;
    header: string;
    headerPrepend?: string | ReactNode;
    innerStyle?: null | ViewStyle;
    backgroundBlur?: boolean,
} ) => {
	const { width, height } = useWindowDimensions();
    const theme = useTheme();
    const context = useContext( AppContext );
    const keyboardShown = useKeyboardShown();
    return <Portal><AppContext.Provider value={ context } >
        <Modal
            theme={ backgroundBlur ? theme : { colors: {
                ...theme.colors,
                backdrop: 'transparent',
            } } }
            onDismiss={ () => {
                if ( keyboardShown ) {
                    Keyboard.dismiss();
                } else {
                    onDismiss();
                }
            } }
            visible={ visible }
            style={ { opacity: 1 } }
            contentContainerStyle={ {
                width,
                height,
                justifyContent: 'center',
                alignItems: 'center',
            } }
        >
            <Pressable
                style={ styles.absolute }
                onPress={ () => {
                    if ( keyboardShown ) {
                        Keyboard.dismiss();
                    } else {
                        onDismiss();
                    }
                } }
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
                        width: width * modalWidthFactor,
                        maxHeight: height * 0.75,
                        padding: 20,
                        borderColor: theme.colors.outline,
                        borderWidth: 1,
                        borderRadius: theme.roundness,
                    } }
                >
                    <View style={ {
                        width: '90%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 10,
                    } }>
                        { onHeaderBackPress && <TouchableHighlight
                            underlayColor={ theme.colors.elevation.level3 }
                            style={ {
                                padding: 5,
                                borderRadius: theme.roundness,
                                marginRight: 10,
                            } }
                            onPress={ () => {
                                if ( keyboardShown ) {
                                    Keyboard.dismiss();
                                } else {
                                    onHeaderBackPress();
                                }
                            }  }
                        ><Icon
                            source="arrow-left"
                            size={ 25 }
                        /></TouchableHighlight> }
                        { headerPrepend && 'string' === typeof headerPrepend && <Text>{ headerPrepend }</Text> }
                        { headerPrepend && 'string' !== typeof headerPrepend && headerPrepend }
                        { header && <View>
                            { header.split( '-' ).map( ( str, index ) => <Text key={ index } style={ theme.fonts.headlineSmall } >
                                { str + ( index < header.split( '-' ).length - 1 ? '-' : '' ) }
                            </Text> ) }
                        </View>}
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