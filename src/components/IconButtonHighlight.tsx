/**
 * External dependencies
 */
import {
	useTheme,
    IconButton,
    IconButtonProps,
} from 'react-native-paper';
import { useState } from 'react';
import { GestureResponderEvent } from 'react-native';

const IconButtonHighlight = ( props : IconButtonProps ) => {
    const [pressing,setPressing] = useState( false );
    const theme = useTheme();
    return <IconButton
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
    />
};

export default IconButtonHighlight;