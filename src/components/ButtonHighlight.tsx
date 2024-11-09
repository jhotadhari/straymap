/**
 * External dependencies
 */
import { Props as ButtonProps } from 'react-native-paper/lib/typescript/components/Button/Button';
import {
	useTheme,
	Button,
} from 'react-native-paper';
import { useState } from 'react';
import { GestureResponderEvent } from 'react-native';

const ButtonHighlight = ( props : ButtonProps ) => {
    const [pressing,setPressing] = useState( false );
    const theme = useTheme();
    return <Button
        {...props}
        onPressIn={ ( e: GestureResponderEvent ) => {
            setPressing( true );
            props.onPressIn ? props.onPressIn( e ) : null;
        } }
        onPressOut={ ( e: GestureResponderEvent ) => {
            setPressing( false );
            props.onPressOut ? props.onPressOut( e ) : null;
        } }
        style={ {
            ...( props.style && 'object' === typeof props.style && props.style ),
            ...( pressing && { backgroundColor: theme.colors.elevation.level3 } ),
        } }
    >
        { props.children }
    </Button>
};

export default ButtonHighlight;