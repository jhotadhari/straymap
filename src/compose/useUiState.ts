
/**
 * External dependencies
 */
import {
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { UiState } from '../types';
import { defaults } from '../constants';

const useUiState = ( key: string ) => {

    const {
        uiState,
        setUiState,
    } = useContext( AppContext );

    const [value,setValue] = useState<any>( get( uiState || defaults.uiState, key ) );
    const valueRef = useRef<any>( value );
    useEffect( () => {
        valueRef.current = value;
    }, [value])

    const saveUiState = () => uiState && setUiState && setUiState( ( uiState: UiState ) => ( {
        ...uiState,
        [key]: valueRef.current,
    } ) );
    useEffect( () => saveUiState, [] );    // Save on unmount.

    return {
        value,
        setValue,
    };
};

export default useUiState;