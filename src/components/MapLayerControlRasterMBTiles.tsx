/**
 * External dependencies
 */
import {
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    Linking,
    TextStyle,
	View,
} from 'react-native';
import {
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get, isNull } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import { AbsPath, MapConfig, MapConfigOptionsRasterMBtiles, OptionBase } from '../types';
import NumericMultiRowControl from './NumericMultiRowControl';
import InfoRowControl from './InfoRowControl';
import { AppContext } from '../Context';
import { useDirsInfo } from '../compose/useDirInfo';
import ModalWrapper from './ModalWrapper';
import RadioListItem from './RadioListItem';


interface AbsPathOption extends OptionBase {
    key: AbsPath;
}

const SourceRowControl = ( {
    filePattern,
    dirs,
    options,
    setOptions,
} : {
    filePattern: RegExp;
    dirs: AbsPath[],
    options: MapConfigOptionsRasterMBtiles;
    setOptions: ( options : MapConfigOptionsRasterMBtiles ) => void;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );

    const dirsInfos = useDirsInfo( dirs || [] );

    const [optsMap,setOptsMap] = useState<{ [value: string]: AbsPathOption[] }>( {} );

    useEffect( () => {
        let newOptsMap = {};
        Object.keys( dirsInfos ).map( key => {
            const dirInfo = dirsInfos[key];
            newOptsMap = {
                ...newOptsMap,
                [key]: dirInfo && dirInfo.navChildren ? [...dirInfo.navChildren].filter( child => child.isFile && child.canRead ).map( child => {
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

    const getInitialSelectedOpt = () => options.mapFile
        ? get( Object.values( optsMap ).flat().find( opt => opt.key === options.mapFile ), 'key', null )
        : null;

	const [selectedOpt,setSelectedOpt] = useState<null | AbsPath>( getInitialSelectedOpt() );

    useEffect( () => {
        if ( null === selectedOpt ) {
            setSelectedOpt( getInitialSelectedOpt );
        }
    }, [optsMap] );

    useEffect( () => {
        if ( selectedOpt ) {
            setOptions( {
                ...options,
                mapFile: selectedOpt,
            } );
        }
    }, [selectedOpt] );

    return <InfoRowControl
            label={ t( 'map.file' ) }
            Info={ <Text>{ 'bla bla ??? info text' }</Text> }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            header={ 'Select map file' }
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
                        <Text>MBtiles files in: </Text>
                        <Text style={ theme.fonts.bodySmall }>{ key }</Text>
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
                        <Text>No MBtiles files in: </Text>
                        <Text style={ theme.fonts.bodySmall }>{ key }</Text>
                    </View> }
                </View>;
            } ) }
        </ModalWrapper> }

        <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
            <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setModalVisible( true ) } >
                <Text>{ t( selectedOpt ? get( Object.values( optsMap ).flat().find( opt => opt.key === selectedOpt ), 'label', '' ) : 'nothingSelected' ) }</Text>
            </ButtonHighlight>
        </View>

    </InfoRowControl>;
};

const MapLayerControlRasterMBTiles = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: MapConfig;
    updateLayer: ( newItem : MapConfig ) => void;
} ) => {

	const { t } = useTranslation();

    const { appDirs } = useContext( AppContext );


    const [options,setOptions] = useState<MapConfigOptionsRasterMBtiles>( editLayer.options as MapConfigOptionsRasterMBtiles );

    const doUpdate = debounce( () => {
        updateLayer( {
            ...editLayer,
            options,
        } );
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [Object.values( options ).join( '' )] );

    return <View>

        <SourceRowControl
            options={ options }
            setOptions={ setOptions }
            filePattern={ /.*\.mbtiles$/ }
            dirs={ appDirs ? appDirs.mapfiles : [] }
        />

        <NumericMultiRowControl
            label={ t( 'enabled' ) }
            optKeys={ ['enabledZoomMin','enabledZoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
        />

    </View>;

};

export default MapLayerControlRasterMBTiles;