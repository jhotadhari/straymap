/**
 * External dependencies
 */
import {
    ReactNode,
} from 'react';
import {
	View,
} from 'react-native';
import {
    Text,
    useTheme,
    TextInput,
} from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { MapConfigOptionsAny } from '../types';
import InfoRowControl from './InfoRowControl';

const NumericMultiRowControl = ( {
    label,
    optKeys,
    optLabels,
    options,
    setOptions,
    Info,
} : {
    label?: string;
    optKeys: string[];
    optLabels: string[];
    options: MapConfigOptionsAny;
    setOptions: ( options : any ) => void;
    Info?: ReactNode;
} ) => {
    const theme = useTheme();
    return <InfoRowControl
        label={ label }
        Info={ Info }
    >
        <View style={ { flexDirection: 'row', justifyContent: 'space-between', flexGrow: 1 } }>
            { [...optKeys].map( ( optKey, index ) => <View key={ index } style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
                { get( optLabels, index, undefined ) && <Text style={ { marginRight: 10 } }>{ get( optLabels, index, undefined ) }</Text> }
                <TextInput
                    style={ { maxWidth: 60 } }
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
            </View> ) }
        </View>
    </InfoRowControl>
};

export default NumericMultiRowControl;