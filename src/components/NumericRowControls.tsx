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
    ViewStyle,
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
import useKeyboardShown from '../compose/useKeyboardShown';

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
    style = {},
    Info,
    numType = 'int',
    validate,
} : {
    label?: string;
    optKey: string;
    options: object;
    setOptions: ( options : any ) => void;
    inputStyle?: TextStyle;
    style?: ViewStyle;
    Info?: ReactNode;
    numType?: NumType;
    validate?: ( val : number ) => boolean;
} ) => {
    const theme = useTheme();
    const keyboardShown = useKeyboardShown();
    const initialVal: string = get( options, optKey, '' ) + '';
    const [val,setVal] = useState( initialVal );
    const [isValid,setIsValid] = useState( true );
    const [blurred,setBlurred] = useState( false );

    // Save
    useEffect( () => {
        if ( blurred ) {
            setOptions( getNewOptions( optKey, val, options, numType, validate ) );
        }
        setBlurred( false );
    }, [val,blurred] );

    const onBlur = () => {
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
    };

    // Blur on keyboard hide.
    useEffect( () => {
        if (
            ! blurred
            && ! keyboardShown
            && val !== initialVal
        ) {
            onBlur();
        }
    }, [
        initialVal,
        val,
        keyboardShown,
        blurred,
    ] );

    return <InfoRowControl
        label={ label }
        Info={ Info }
        style={ style }
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
            onBlur={ onBlur }
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
    const keyboardShown = useKeyboardShown();
    const initialVals: string[] = [...optKeys].map( optKey => get( options, optKey, '' ) + '' );
    const [vals,setVals] = useState( initialVals );
    const [isValids,setIsValids] = useState( Array.from( { length: optKeys.length }, () => true ) );
    const [blurred,setBlurred] = useState( false );

    // Save
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

    const onBlur = ( index: number, optKey: string ) => {
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
    };

    // Blur on keyboard hide.
    useEffect( () => {
        if (
            ! blurred
            && ! keyboardShown
            && vals.toString() !== initialVals.toString()
        ) {
            [...optKeys].map( ( optKey, index ) => {
                onBlur( index, optKey );
            } );
        }
    }, [
        initialVals,
        vals,
        keyboardShown,
        blurred,
    ] );

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
                    onBlur={ () => onBlur( index, optKey ) }
                    value={ vals[index] }
                    keyboardType='numeric'
                />
            </View> ) }
        </View>
    </InfoRowControl>
};
