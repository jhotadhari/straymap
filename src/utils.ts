/**
 * External dependencies
 */
import { get, omit, set } from "lodash-es";
import slugify from "slugify";

/**
 * Internal dependencies
 */
import { LayerConfigOptionsAny, LayerConfigOptionsHillshading } from "./types";
import { defaults } from "./constants";

export const randomNumber = ( min : number, max : number ) : number => Math.random() * ( max - min ) + min;

export const formatSeconds = ( secNum : number ) : string => {
    secNum = Math.round( secNum );
    const hours : number = Math.floor( secNum / 3600);
    const minutes : number = Math.floor( ( secNum - ( hours * 3600 ) ) / 60 );
    const seconds : number = secNum - ( hours * 3600 ) - ( minutes * 60 );
    return [
        ( hours < 10 ? '0' : '' ) + hours + 'h',
        ( minutes < 10 ? '0' : '' ) + minutes + 'm',
        ( seconds < 10 ? '0' : '' ) + seconds + 's',
    ].join( ' ' );
};

export const roundTo = ( num: number, precision: number ) : number => {
    const factor = Math.pow( 10, precision );
    return Math.round( num * factor ) / factor;
};

let firstNonEmptyLine: null | number = null;
const filterCb = ( line: string, idx: number ) => {
    if ( 0 === idx ) {
        firstNonEmptyLine = null;
    }
    if ( null !== firstNonEmptyLine ) {
        return true;
    }
    if ( line.replace( /\s/, '' ).length ) {
        firstNonEmptyLine = idx;
        return true;
    }
    return false;
};
export const removeLeadingTrailingEmptyLines = ( str: string, skipLinesNb?: number ) : string => {
    skipLinesNb = undefined === skipLinesNb ? 0 : skipLinesNb;
    const lines = str.split( '\n' ).slice( skipLinesNb );
    return lines.filter( filterCb )
        .reverse()
        .filter( filterCb )
        .reverse()
        .join( '\n' );
};

export const removeLines = ( str: string, pattern: RegExp ) : string => {
    const lines = str.split( '\n' );
    return lines.filter( ( line: string ) => {
        return ! line.match( pattern );
    } ).join( '\n' );
};

export const fillLayerConfigOptionsWithDefaults = ( type : string, options : LayerConfigOptionsAny ) : LayerConfigOptionsAny => {
    const newOptions = {...options};
    const defaultOptions = get( defaults.layerConfigOptions, type );
    Object.keys( defaultOptions ).map( optKey => {
        if ( null === get( newOptions, optKey, null ) ) {
            set( newOptions, optKey, defaultOptions[optKey] );
        }
    } );
    return newOptions;
};

export const stringifyProp = ( prop: any ) : string => {
    switch( true ) {
        case ( 'string' === typeof prop ):
        case ( 'number' === typeof prop ):
            return slugify( prop + '', { strict: true } );
        case ( 'object' === typeof prop ):
            return Object.keys( prop ).sort().reduce( ( acc: string, optKey: string ) => {
                return acc + stringifyProp( get( prop, optKey ) );
            }, '' );
        default:
            return '';
    }
};

export const getHillshadingCacheDirChild = ( options: LayerConfigOptionsHillshading ) : string => {
    return 'shading' + stringifyProp( omit( options, [
        'enabledZoomMin',
        'enabledZoomMax',
        'zoomMin',
        'zoomMax',
        'cacheSize',
        'cacheDirBase',
        'hgtDirPath',
    ] ) );
};