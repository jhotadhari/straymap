/**
 * External dependencies
 */
import {
    ReactNode,
} from 'react';
import {
    TextStyle,
} from 'react-native';
import {
    useTheme,
    TextInput,
} from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { MapConfigOptionsAny } from '../types';
import InfoRowControl from './InfoRowControl';

const NumericRowControl = ( {
    label,
    optKey,
    options,
    setOptions,
    inputStyle,
    Info,
} : {
    label?: string;
    optKey: string;
    options: MapConfigOptionsAny;
    setOptions: ( options : MapConfigOptionsAny ) => void;
    inputStyle?: TextStyle;
    Info?: ReactNode;
} ) => {
    const theme = useTheme();
    return <InfoRowControl
        label={ label }
        Info={ Info }
    >
       <TextInput
            style={ { flexGrow: 1, ...inputStyle } }
            underlineColor="transparent"
            dense={ true }
            theme={ { fonts: { bodyLarge: {
                ...theme.fonts.bodySmall,
                fontFamily: "sans-serif",
            } } } }
            onChangeText={ newVal => setOptions( { ...options, [optKey]: parseInt( newVal.replace(/[^0-9]/g, ''), 10 ) } ) }
            value={ get( options, optKey, '' ) + '' }
            keyboardType='numeric'
        />
    </InfoRowControl>
};

export default NumericRowControl;