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

const strValToNb = (
    val : string,
    numType : NumType,
) => {
    switch( true ) {
        case ( numType === 'int' ):
            return parseInt( ( val.trim().startsWith( '-' ) ? '-' : '' ) + val.trim().replace( /[^0-9]/g, ''), 10 );
        case ( numType === 'float' ):
            return parseFloat( ( val.trim().startsWith( '-' ) ? '-' : '' ) + val.trim().replace( /,/g, '.' ).replace( /[^0-9.]/g, '' ) );
    }
};

const getNewOptions = (
    optKey: string,
    val : string,
    options : object,
    numType : NumType,
    validate : ( undefined | ( ( val : number ) => boolean ) )
) : object => {
    let newOptions = {...options};
    let newValNb = strValToNb( val, numType );
    if (
        'number' === typeof newValNb
        && ! isNaN( newValNb )
        && ( ! validate || ( validate && validate( newValNb ) ) )
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
    validate,
} : {
    label?: string;
    optKey: string;
    options: object;
    setOptions: ( options : any ) => void;
    inputStyle?: TextStyle;
    Info?: ReactNode;
    numType?: NumType;
    validate?: ( val : number ) => boolean;
} ) => {
    const theme = useTheme();
    const [val,setVal] = useState( get( options, optKey, '' ) + '' );
    const [isValid,setIsValid] = useState( true );
    const [blurred,setBlurred] = useState( false );
    useEffect( () => {
        if ( blurred ) {
            setOptions( getNewOptions( optKey, val, options, numType, validate ) );
        }
        setBlurred( false );
    }, [val,blurred ] );
    return <InfoRowControl
        label={ label }
        Info={ Info }
    >
       <TextInput
            style={ { flexGrow: 1, ...inputStyle } }
            underlineColor="transparent"
            error={ ! isValid }
            dense={ true }
            theme={ { fonts: { bodyLarge: {
                ...theme.fonts.bodySmall,
                fontFamily: "sans-serif",
            } } } }
            onChangeText={ newVal => {
                if ( validate ) {
                    let newValNb = strValToNb( newVal, numType );
                    if (
                        'number' !== typeof newValNb
                        || isNaN( newValNb )
                        || ! validate( newValNb )
                    ) {
                        setIsValid( false );
                    } else {
                        setIsValid( true );
                    }
                }
                setVal( newVal );
                setBlurred( false );
            } }
            onBlur={ () => {
                let newValNb = strValToNb( val, numType );
                if (
                    'number' !== typeof newValNb
                    || isNaN( newValNb )
                    || ( validate && ! validate( newValNb ) )
                ) {
                    // reset val
                    setVal( get( options, optKey, '' ) + '' );
                } else {
                    setVal( newValNb + '' );
                }
                setIsValid( true );
                setBlurred( true );
            } }
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
    validate,
} : {
    label?: string;
    optKeys: string[];
    optLabels: string[];
    options: object;
    setOptions: ( options : any ) => void;
    Info?: ReactNode;
    numType?: 'int' | 'float';
    validate?: ( val : number ) => boolean;
} ) => {
    const theme = useTheme();
    const [vals,setVals] = useState( [...optKeys].map( optKey => get( options, optKey, '' ) + '' ) );
    const [isValids,setIsValids] = useState( Array.from( { length: optKeys.length }, () => true ) );
    const [blurred,setBlurred] = useState( false );
    useEffect( () => {
        if ( blurred ) {
            let newOptions = {...options};
            [...optKeys].map( ( optKey, index ) => {
                newOptions = getNewOptions( optKey, vals[index], newOptions, numType, validate );
            } );
            setOptions( newOptions );
        }
        setBlurred( false );
    }, [vals] );
    return <InfoRowControl
        label={ label }
        Info={ Info }
    >
        <View style={ { flexDirection: 'row', justifyContent: 'space-between', flexGrow: 1 } }>
            { [...optKeys].map( ( optKey, index ) => <View key={ index } style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
                { get( optLabels, index, undefined ) && <Text style={ { marginRight: 10 } }>{ get( optLabels, index, undefined ) }</Text> }
                <TextInput
                    style={ { maxWidth: 50 } }
                    underlineColor="transparent"
                    error={ ! isValids[index] }
                    dense={ true }
                    theme={ { fonts: { bodyLarge: {
                        ...theme.fonts.bodySmall,
                        fontFamily: "sans-serif",
                    } } } }
                    onChangeText={ newVal => {
                        if ( validate ) {
                            let newValNb = strValToNb( newVal, numType );
                            const newIsValids = [...isValids];
                            if (
                                'number' !== typeof newValNb
                                || isNaN( newValNb )
                                || ! validate( newValNb )
                            ) {
                                newIsValids.splice( index, 1, false );
                            } else {
                                newIsValids.splice( index, 1, true );
                            }
                            setIsValids( newIsValids );
                        }
                        const newVals = [...vals];
                        newVals.splice( index, 1, newVal );
                        setVals( newVals );
                        setBlurred( false );
                    } }
                    onBlur={ () => {
                        let newValNb = strValToNb( vals[index], numType );
                        if (
                            'number' !== typeof newValNb
                            || isNaN( newValNb )
                            || ( validate && ! validate( newValNb ) )
                        ) {
                            // reset val
                            const newVals = [...vals];
                            newVals.splice( index, 1, get( options, optKey, '' ) + '' );
                            setVals( newVals );
                        } else {
                            const newVals = [...vals];
                            newVals.splice( index, 1, newValNb + '' );
                            setVals( newVals );
                        }
                        const newIsValids = [...isValids];
                        newIsValids.splice( index, 1, true );
                        setIsValids( newIsValids );
                        setBlurred( true );
                    } }
                    value={ vals[index] }
                    keyboardType='numeric'
                />
            </View> ) }
        </View>
    </InfoRowControl>
};
