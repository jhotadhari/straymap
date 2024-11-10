
/**
 * External dependencies
 */
import React, {
	ReactNode,
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
} : {
    children?: ReactNode;
    visible: boolean;
    onDismiss: () => void;
    header: string;
    headerPrepend?: string | ReactNode;
    innerStyle?: null | ViewStyle;
} ) => {

	const { width, height } = useWindowDimensions();
    const theme = useTheme();


    return <Portal>
        <Modal
            onDismiss={ onDismiss }
            visible={ visible }
            contentContainerStyle={ {
                width,
                height,
                justifyContent: 'center',
                alignItems: 'center',
            } }
        >
            <Pressable
                style={ styles.absolute }
                onPress={ onDismiss }
            >
                <BlurView
                    style={ styles.absolute }
                    blurAmount={ 1 }
                    blurType={ theme.dark ? 'dark' : 'light' }
                />
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
    </Portal>;
};

export default ModalWrapper;