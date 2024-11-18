/**
 * External dependencies
 */
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import {
	View,
} from 'react-native';
import {
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import { AbsPath, LayerConfigOptionsRasterMBtiles, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import { useDirsInfo } from '../compose/useDirInfo';
import ModalWrapper from './ModalWrapper';
import RadioListItem from './RadioListItem';

interface Option extends OptionBase {
    key: string;
};

type OptsMap = { [value: string]: Option[] };

const FileSourceRowControl = ( {
    filePattern,
    dirs,
    options,
    optionsKey,
    onSelect,
    label,
    header,
    Info,
    filesHeading,
    noFilesHeading,
    initialOptsMap = {},
    AlternativeButton,
} : {
    filePattern: RegExp;
    dirs: AbsPath[],
    options: object;
    optionsKey: string;
    onSelect: ( option : any ) => void;
    label: string;
    header?: string;
    Info?: ReactNode | string;
    filesHeading?: string;
    noFilesHeading?: string;
    initialOptsMap?: OptsMap;
    AlternativeButton?: ( {
        setModalVisible
    } : {
        setModalVisible?: Dispatch<SetStateAction<boolean>>
    } ) => ReactNode;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );

    const dirsInfos = useDirsInfo( dirs || [] );

    const [optsMap,setOptsMap] = useState<OptsMap>( {} );

    useEffect( () => {
        let newOptsMap = {...initialOptsMap};
        Object.keys( dirsInfos ).map( key => {
            const dirInfo = dirsInfos[key];
            newOptsMap = {
                ...newOptsMap,
                [key]: dirInfo && dirInfo.navChildren ? [...dirInfo.navChildren].filter( child => child.isFile && child.canRead && filePattern.test( child.name ) ).map( child => {
                    const nameArr = child.name.split( '/' );
                    return {
                        key: child.name,
                        label: nameArr[nameArr.length-1],
                    };
                } ) : []
            }
        } );
        setOptsMap( newOptsMap );
    }, [dirsInfos] );

    const getInitialSelectedOpt = () => get( options, optionsKey )
        ? get( Object.values( optsMap ).flat().find( opt => opt.key === get( options, optionsKey ) ), 'key', null )
        : null;

	const [selectedOpt,setSelectedOpt] = useState<null | string>( getInitialSelectedOpt() );

    useEffect( () => {
        if ( null === selectedOpt ) {
            setSelectedOpt( getInitialSelectedOpt );
        }
    }, [optsMap] );

    useEffect( () => {
        if ( selectedOpt ) {
            onSelect( selectedOpt )
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
                                    setSelectedOpt( opt.key );
                                    setModalVisible( false );
                                }
                            } }
                            labelStyle={ theme.fonts.bodyMedium }
                            labelExtractor={ a => a.label }
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

        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            { ! AlternativeButton && <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setModalVisible( true ) } >
                <Text>{ t( selectedOpt ? get( Object.values( optsMap ).flat().find( opt => opt.key === selectedOpt ), 'label', '' ) : 'nothingSelected' ) }</Text>
            </ButtonHighlight> }

            { AlternativeButton && <AlternativeButton setModalVisible={ setModalVisible } /> }
        </View>

    </InfoRowControl>;
};

export default FileSourceRowControl;