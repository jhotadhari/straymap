/**
 * External dependencies
 */
import {
    ReactNode,
    useEffect,
    useState,
} from 'react';
import {
    TextStyle,
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
import InfoRowControl from './InfoRowControl';

type NumType = 'int' | 'float';
type Range = { min: number, max: number };

const getNewOptions = ( optKey: string, val : string, options : object, numType : NumType, range : ( undefined | Range ) ) : object => {
    let newValNb;
    let newOptions = {...options};
    switch( true ) {
        case ( numType === 'int' ):
            newValNb = parseInt( val.replace(/[^0-9]/g, ''), 10 );
            break
        case ( numType === 'float' ):
            newValNb = parseFloat( val.replace( /,/g, '.' ).replace( /[^0-9.]/g, '' ) );
            break
    }
    if (
        'number' === typeof newValNb
        && ! isNaN( newValNb )
        && ( ! range || ( range && newValNb >= range.min && newValNb <= range.max ) )
    ) {
        newOptions = { ...options, [optKey]: newValNb };
    }
    return newOptions;
};

export const NumericRowControl = ( {
    label,
    optKey,
    options,
    setOptions,
    inputStyle,
    Info,
    numType = 'int',
    range,
} : {
    label?: string;
    optKey: string;
    options: object;
    setOptions: ( options : any ) => void;
    inputStyle?: TextStyle;
    Info?: ReactNode;
    numType?: NumType;
    range?: Range;
} ) => {
    const theme = useTheme();
    const [val,setVal] = useState( get( options, optKey, '' ) + '' );
    useEffect( () => {
        setOptions( getNewOptions( optKey, val, options, numType, range ) );
    }, [val] );
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
            onChangeText={ setVal }
            value={ val }
            keyboardType='numeric'
        />
    </InfoRowControl>
};

export const NumericMultiRowControl = ( {
    label,
    optKeys,
    optLabels,
    options,
    setOptions,
    Info,
    numType = 'int',
    range,
} : {
    label?: string;
    optKeys: string[];
    optLabels: string[];
    options: object;
    setOptions: ( options : any ) => void;
    Info?: ReactNode;
    numType?: 'int' | 'float';
    range?: Range;
} ) => {
    const theme = useTheme();
    const [vals,setVals] = useState( [...optKeys].map( optKey => get( options, optKey, '' ) + '' ) );
    useEffect( () => {
        let newOptions = {...options};
        [...optKeys].map( ( optKey, index ) => {
            newOptions = getNewOptions( optKey, vals[index], newOptions, numType, range );
        } );
        setOptions( newOptions );
    }, [vals] );
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
                    onChangeText={ newVal => {
                        const newVals = [...vals];
                        newVals.splice( index, 1, newVal );
                        setVals( newVals );
                    } }
                    value={ vals[index] }
                    keyboardType='numeric'
                />
            </View> ) }
        </View>
    </InfoRowControl>
};
