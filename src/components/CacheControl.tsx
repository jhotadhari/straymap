/**
 * External dependencies
 */
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { TextInput, useTheme } from "react-native-paper";

/**
 * Internal dependencies
 */
import { NumericRowControl } from "./generic/NumericRowControls";
import InfoRowControl from "./generic/InfoRowControl";
import ListItemMenuControl from "./generic/ListItemMenuControl";
import { get } from "lodash-es";
import { AppContext } from "../Context";
import { useContext, useEffect } from "react";
import { OptionBase } from "../types";

const CacheControl = ( {
    options,
    setOptions,
    baseDefault,
    cacheDirChild,
} : {
    options: object;
    setOptions: ( options : any ) => void;
    baseDefault: string;
    cacheDirChild: string;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

    const {
        appDirs,
    } = useContext( AppContext )
    const externalCacheDir = get( appDirs, 'externalCacheDir', undefined ) as ( undefined | `/${string}` );
    const opts = [
        {
            key: 'internal',
            label: t( 'internal' ),
        },
        ...( externalCacheDir && externalCacheDir.length > 0 ? [{
            key: externalCacheDir,
            label: t( 'external' ),
        }] : [] ),
        ...( get( appDirs, 'externalCacheDirs', [] ).map( ( dir, idx ) => externalCacheDir && dir === externalCacheDir ? false : {
            key: dir,
            label: t( 'external' ) + ' ' + idx,
        } ).filter( a => !! a ) ),
    ] as OptionBase[];

    const selectedOpt = opts.find( opt => opt.key === get( options, 'cacheDirBase' ) );

    // Reset to default if option is gone.
    useEffect( () => {
        if ( appDirs && ! selectedOpt ) {
            setOptions( {
                ...options,
                cacheDirBase: baseDefault,
            } );
        }
    }, [
        selectedOpt,
        appDirs,
    ] );

    if ( ! appDirs ) {
        return null;
    }

    const cachePath = ( 'internal' === get( selectedOpt, 'key' )
        ? get( appDirs, 'internalCacheDir', '' )
        : get( selectedOpt, 'key' )
    ) + '/' + cacheDirChild;

    return <View>

        <NumericRowControl
            label={ t( 'cacheSize' ) }
            optKey={ 'cacheSize' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.cache' ) + '\n\n' + t( 'hint.maps.cacheSize' ) }
        />

        <InfoRowControl
            label={ t( 'cacheDir' ) }
            Info={ t( 'hint.maps.cache' ) + '\n\n' + t( 'hint.maps.cacheDir' ) }
        >
            <ListItemMenuControl
                options={ opts }
                listItemStyle={ {
                    marginLeft: 0,
                    paddingLeft: 10,
                } }
                value={ get( selectedOpt, 'key' ) }
                setValue={ newValue => setOptions( {
                    ...options,
                    cacheDirBase: newValue,
                } ) }
                anchorLabel={ get( selectedOpt, 'label', '' ) }
            />
        </InfoRowControl>

        <TextInput
            disabled={ true }
            underlineColor="transparent"
            multiline={ true }
            numberOfLines={ 4 } // ??? set automatically
            dense={ true }
            theme={ { fonts: { bodyLarge: {
                ...theme.fonts.bodySmall,
                fontFamily: "sans-serif",
            } } } }
            style={ {
                width: '100%',
                marginTop: -18,
                marginBottom: 10
            } }
            value={ cachePath }
        />


        {/* ??? cache size info and clear btn */}

    </View>

};

export default CacheControl;