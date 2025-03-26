/**
 * External dependencies
 */
import {
    useEffect,
    useState,
} from 'react';
import {
    Linking,
	View,
} from 'react-native';
import {
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { openDocumentTree } from "react-native-scoped-storage"

/**
 * react-native-mapsforge-vtm dependencies
 */
import { MapContainerProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import { AbsPath, HgtDirPath, LayerConfigOptionsHillshading, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import ModalWrapper from './ModalWrapper';
import RadioListItem from './RadioListItem';
import HintLink from './HintLink';

const HgtSourceRowControl = ( {
    dirs,
    options,
    optKey,
    setOptions,
} : {
    dirs: AbsPath[],
    options: object;
    optKey: string;
    setOptions: ( options : object ) => void;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );

    let opts : OptionBase[] = [
        {
            key: 'custom',
            label: t( 'custom' ),
        },
    ];
    [...dirs].reverse().map( ( dir : AbsPath ) => {
        opts = [
            {
                key: dir,
                label: dir,
            },
            ...opts,
        ];
    } );

    const getInitialSelectedOpt = () : ( null | 'custom' | HgtDirPath ) => {
        if ( get( options, optKey ) ) {
            const opt = opts.find( opt => opt.key === get( options, optKey ) );
            return opt ? get( opt, 'key', null ) as ( null | HgtDirPath ) : 'custom';
        } else {
            return null;
        }
    };

	const [selectedOpt,setSelectedOpt] = useState<null | 'custom' | HgtDirPath>( getInitialSelectedOpt() );

	const [customUri,setCustomUri] = useState<undefined | `content://${string}`>( 'string' === typeof get( options, optKey, '' ) && get( options, optKey, '' ).startsWith( 'content://' )
        ? get( options, optKey ) as `content://${string}`
        : undefined
    );

    useEffect( () => {
        setOptions( {
            ...options,
            [optKey]: 'custom' === selectedOpt ? customUri : selectedOpt,
        } );
    }, [selectedOpt] );

    return <InfoRowControl
        label={ t( 'map.demDir' ) }
        Info={ <View>
            <Text>{ t( 'hint.maps.demDir' ) }</Text>
            <Text style={ {
                marginTop: 20,
                ...theme.fonts.bodyLarge,
            } }>{ 'DEM Downloads:' }</Text>
            <HintLink
                label={ t( 'hint.link.digitalEleData' ) }
                url={ 'https://viewfinderpanoramas.org/dem3.html' }
            />
            <HintLink
                label={ t( 'hint.link.digitalEleDataCoverage' ) }
                url={ 'https://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm' }
            />
        </View> }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            header={ t( 'map.selectDemDir' ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
        >
            { [...opts].map( opt => {
                return <View
                    key={ opt.key }
                    style={ {
                        marginBottom: 18,
                    } }
                >
                    <RadioListItem
                        key={ opt.key }
                        opt={ opt }
                        onPress={ () => {
                            if ( opt.key === selectedOpt ) {
                                setSelectedOpt( null );
                                setCustomUri( undefined );
                            } else {
                                if ( opt.key === 'custom' ) {
                                    openDocumentTree( true ).then( dir => {
                                        setCustomUri( dir.uri as `content://${string}` );
                                        setSelectedOpt( 'custom' );
                                        setModalVisible( false );
                                    } ).catch( ( err : any ) => console.log( err ) );
                                } else {
                                    setCustomUri( undefined );
                                    setSelectedOpt( opt.key as HgtDirPath );
                                    setModalVisible( false );
                                }
                            }
                        } }
                        labelStyle={ theme.fonts.bodyMedium }
                        labelExtractor={ a => a.label }
                        descExtractor={ opt.key === 'custom' ? () => ( customUri ? customUri?.replace( 'content://', 'content:// ' ) : null ) : undefined }
                        status={ opt.key === selectedOpt ? 'checked' : 'unchecked' }
                    />
                </View>;
            } ) }

            <ButtonHighlight
                style={ { marginTop: 10 } }
                onPress={ () => {
                    setModalVisible( false );
                } }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            <ButtonHighlight style={ { marginTop: 3 } } onPress={ () => setModalVisible( true ) } >
                <Text>{ t( selectedOpt
                    ? ( 'custom' === selectedOpt && customUri
                        ? customUri?.replace( 'content://', 'content:// ' ).slice( 0, Math.min( customUri.length - 1, 30 ) )
                        : get( opts.find( opt => opt.key === selectedOpt ), 'label', '' )
                    )
                    : 'selected.none'
                ) }</Text>
            </ButtonHighlight>
        </View>

    </InfoRowControl>;
};

export default HgtSourceRowControl;