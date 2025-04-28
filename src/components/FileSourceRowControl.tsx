/**
 * External dependencies
 */
import {
    Dispatch,
    ReactElement,
    ReactNode,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import {
    InteractionManager,
	View,
} from 'react-native';
import {
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { openDocument } from 'react-native-scoped-storage';

/**
 * Internal dependencies
 */
import ButtonHighlight from './generic/ButtonHighlight';
import { AbsPath, OptionBase } from '../types';
import InfoRowControl from './generic/InfoRowControl';
import useDirsInfo from '../compose/useDirsInfo';
import ModalWrapper from './generic/ModalWrapper';
import RadioListItem from './generic/RadioListItem';
import LoadingIndicator from './generic/LoadingIndicator';
import { runAfterInteractions } from '../utils';

interface Option extends OptionBase {
    key: string;
};

type OptsMap = { [value: string]: Option[] };

const getLabelFromUri = ( uri?: `content://${string}` ) => {
    if ( ! uri ) {
        return '';
    }
    const parts = uri.split( '%2F' );
    return parts.length > 0 ? parts[parts.length-1] : '';
};

export type AlternativeButtonType = null | ( ( {
    setModalVisible
} : {
    setModalVisible?: Dispatch<SetStateAction<boolean>>
} ) => ReactElement );

const FileSourceRowControl = ( {
    filePattern,
    extensions,
    dirs,
    options,
    optionsKey,
    onSelect,
    label,
    header,
    Info,
    After,
    filesHeading,
    noFilesHeading,
    hasCustom,
    initialOptsMap = {},
    AlternativeButton = null,
} : {
    filePattern?: RegExp;
    extensions?: string[];
    dirs?: AbsPath[],
    options: object;
    optionsKey: string;
    onSelect: ( option : any ) => void;
    label: string;
    header?: string;
    Info?: ReactNode | string;
    After?: ReactNode;
    filesHeading?: string;
    noFilesHeading?: string;
    hasCustom?: boolean;
    initialOptsMap?: OptsMap;
    AlternativeButton?: AlternativeButtonType;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );
	const [start, setStart] = useState<boolean | number>( false );

    const dirsInfos = useDirsInfo(
        dirs || [],
        extensions,
        true,
        start
    );

    useEffect( () => {
        runAfterInteractions( () => {
            setStart( Math.random() )
        } );
    }, [] );

    const [optsMap,setOptsMap] = useState<OptsMap>( {} );

    useEffect( () => {
        let newOptsMap = {...initialOptsMap};
        Object.keys( dirsInfos ).map( key => {
            const dirInfo = dirsInfos[key];
            newOptsMap = {
                ...newOptsMap,
                [key]: dirInfo && dirInfo.navChildren ? [...dirInfo.navChildren].filter( child => child.isFile && child.canRead && ( filePattern ? filePattern.test( child.name ) : true ) ).map( child => {
                    const nameArr = child.name.split( '/' );
                    return {
                        key: child.name,
                        label: nameArr.slice( - ( child.depth
                            ? child.depth + 1
                            : 1
                        ) ).join( '/' ),
                    };
                } ) : []
            }
        } );
        if ( hasCustom ) {
            newOptsMap = {
                ...newOptsMap,
                ['']: [ {
                    key: 'custom',
                    label: t( 'custom' ),
                } ],
            };
        }

        setOptsMap( newOptsMap );
    }, [dirsInfos] );

    const getInitialSelectedOpt = () => {
        const selected = get( options, optionsKey, '' );
        if ( selected ) {
            const opt = Object.values( optsMap ).flat().find( opt => opt.key === selected );
            return opt
                ? get( opt, 'key', null ) as ( null | string )
                : ( hasCustom && ( selected as string ).startsWith( 'content://' ) ? 'custom' : null );
        } else {
            return null;
        }
    };

	const [selectedOpt,setSelectedOpt] = useState<null | string>( null );

	const [customUri,setCustomUri] = useState<undefined | `content://${string}`>( get( options, optionsKey, '' ).startsWith( 'content://' )
        ? get( options, optionsKey, '' ) as `content://${string}`
        : undefined
    );

    useEffect( () => {
        if ( null === selectedOpt ) {
            setSelectedOpt( getInitialSelectedOpt() );
        }
    }, [optsMap] );

    useEffect( () => {
        if ( selectedOpt ) {
            onSelect( selectedOpt === 'custom'
                ? customUri
                : selectedOpt
            )
        }
    }, [selectedOpt] );

    return <InfoRowControl
        label={ label }
        Info={ Info }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
            header={ header || label }
        >
            { Object.keys( optsMap ).map( key => {
                const opts = optsMap[key];
                return <View
                    key={ key }
                    style={ {
                        marginBottom: 18,
                    } }
                >
                    { opts.length > 0 && <View>
                        { key.startsWith( '/' ) && <Text>{ filesHeading || '' }:</Text> }
                        <Text style={ key.startsWith( '/' ) ? theme.fonts.bodySmall : {} }>{ key }</Text>
                        { [...opts].map( opt => <RadioListItem
                            key={ opt.key }
                            opt={ opt }
                            onPress={ () => {
                                if ( opt.key === selectedOpt ) {
                                    setSelectedOpt( null );
                                } else {
                                    if ( 'custom' === opt.key ) {
                                        openDocument( false ).then( file => {
                                            setCustomUri( file.uri as `content://${string}` );
                                            setSelectedOpt( 'custom' );
                                            setModalVisible( false );
                                        } ).catch( ( err : any ) => console.log( err ) );
                                    } else {
                                        setCustomUri( undefined );
                                        setSelectedOpt( opt.key );
                                        setModalVisible( false );
                                    }
                                }
                            } }
                            labelStyle={ theme.fonts.bodyMedium }
                            labelExtractor={ a => a.label }
                            descExtractor={ a => 'custom' === a.key
                                ? ( customUri ? customUri?.replace( 'content://', 'content:// ' ) : null )
                                : '' }
                            status={ opt.key === selectedOpt ? 'checked' : 'unchecked' }
                        />) }
                    </View> }

                    { opts.length === 0 && <View>
                        <Text>{ noFilesHeading || '' }:</Text>
                        <Text style={ theme.fonts.bodySmall }>{ key }</Text>
                    </View> }
                </View>;
            } ) }

            <ButtonHighlight
                style={ { marginTop: 10, marginBottom: 40 } }
                onPress={ () => {
                    setModalVisible( false );
                } }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        <View style={ {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '65%',
        } }>
            { ! AlternativeButton && Object.keys( dirsInfos ).length > 0 && <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setModalVisible( true ) } >
                <Text>{ t(
                    'custom' === selectedOpt
                        ? getLabelFromUri( customUri )
                        : ( selectedOpt
                            ? get( Object.values( optsMap ).flat().find( opt => opt.key === selectedOpt ), 'label', '' )
                            : 'selected.none' )
                ) }</Text>
            </ButtonHighlight> }

            { ! AlternativeButton && Object.keys( dirsInfos ).length === 0 && <LoadingIndicator/> }

            { !! AlternativeButton && <AlternativeButton setModalVisible={ setModalVisible } /> }

            { !! After && Object.keys( dirsInfos ).length !== 0 && After }
        </View>

    </InfoRowControl>;
};

export default FileSourceRowControl;