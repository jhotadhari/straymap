/**
 * External dependencies
 */
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    TouchableHighlight,
	View,
} from 'react-native';
import {
    Icon,
    Menu,
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsMapsforge, MapsforgeProfile, OptionBase } from '../types';
import { NumericMultiRowControl } from './NumericRowControls';
import { AppContext } from '../Context';
import FileSourceRowControl from './FileSourceRowControl';
import InfoRowControl from './InfoRowControl';
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';

const ProfileRowControl = ( {
    options,
    setOptions,
    setEditProfile,
    profiles,
    Info,
} : {
    options: LayerConfigOptionsMapsforge;
    setOptions: ( options : LayerConfigOptionsMapsforge ) => void;
    setEditProfile?: Dispatch<SetStateAction<null | MapsforgeProfile>>;
    profiles: MapsforgeProfile[];
    Info?: ReactNode | string;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

    const [menuVisible,setMenuVisible] = useState( false );

    const opts : OptionBase[] = [
        {
            key: 'default',
            label: 'use first one',   // ??? translate
        },
        ...[...profiles].map( prof => {
            const themeArr = prof.theme.split( '/' );
            return {
                key: prof.key,
                label: [prof.name,'[' + themeArr[themeArr.length-1] + ']'].join( ' ' ),
            }
        } )
    ];

    const [selectedOpt,setSelectedOpt] = useState<string | null>( get( opts.find( opt => opt.key === options.profile ), 'key', '' ) );

    useEffect( () => {
        if ( selectedOpt ) {
            setOptions( {
                ...options,
                profile: selectedOpt,
            } );
        }
    }, [selectedOpt] );

    return <InfoRowControl
        label={ t( 'map.mapsforge.profile', { count: 1 } ) }
        Info={ Info }
    >

        <View style={ { flexDirection: 'row' } }>
            <Menu
                contentStyle={ {
                    borderColor: theme.colors.outline,
                    borderWidth: 1,
                } }
                visible={ menuVisible }
                onDismiss={ () => setMenuVisible( false ) }
                anchor={ <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setMenuVisible( true ) } >
                    <Text>{ t( get( opts.find( opt => opt.key === selectedOpt ), 'label', '' ) ) }</Text>
                </ButtonHighlight> }
            >
                { opts && [...opts].map( ( opt, index ) => <MenuItem
                    key={ opt.key }
                    onPress={ () => {
                        setSelectedOpt( opt.key );
                        setMenuVisible( false );
                    } }
                    title={ t( opt.label ) }
                    active={ opt.key === selectedOpt }
                    style={ 'default' === selectedOpt && index === 1 ? {
                        borderLeftColor: theme.colors.primary,
                        borderLeftWidth: 5,
                    } : {} }
                /> ) }
            </Menu>


            { 'default' !== selectedOpt && <TouchableHighlight
                underlayColor={ theme.colors.elevation.level3 }
                onPress={ () => {
                    const newEditProfile = profiles.find( prof => prof.key === selectedOpt )
                    if ( newEditProfile && setEditProfile ) {
                        setEditProfile( newEditProfile );
                    }
                } }
                style={ { padding: 10, borderRadius: theme.roundness } }
            >
                <Icon
                    source="cog"
                    size={ 25 }
                />
            </TouchableHighlight> }

        </View>
    </InfoRowControl>;

};

const MapLayerControlMapsforge = ( {
    editLayer,
    updateLayer,
    setEditProfile,
    profiles,
} : {
    editLayer: LayerConfig;
    updateLayer: ( newItem : LayerConfig ) => void;
    setEditProfile?: Dispatch<SetStateAction<null | MapsforgeProfile>>;
    profiles: MapsforgeProfile[];
} ) => {

	const { t } = useTranslation();

    const { appDirs } = useContext( AppContext );

    const [options,setOptions] = useState<LayerConfigOptionsMapsforge>( editLayer.options as LayerConfigOptionsMapsforge );

    const doUpdate = debounce( () => {
        updateLayer( {
            ...editLayer,
            options,
        } );
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [Object.values( options ).join( '' )] );

    console.log( 'debug editLayer', editLayer ); // debug

    return <View>

        <FileSourceRowControl
            header={ t( 'map.selectFile' ) }
            label={ t( 'map.file' ) }
            options={ options }
            optionsKey={ 'mapFile' }
            onSelect={ selectedOpt => setOptions( {
                ...options,
                mapFile: selectedOpt,
            } ) }
            filePattern={ /.*\.map$/ }
            dirs={ appDirs ? appDirs.mapfiles : [] }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
            filesHeading={ 'map files in' }         // ??? translate
            noFilesHeading={ 'No map files in' }    // ??? translate
            hasCustom={ true }
        />

        <ProfileRowControl
            options={ options }
            setOptions={ setOptions }
            setEditProfile={ setEditProfile }
            profiles={ profiles }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
        />

        <NumericMultiRowControl
            label={ t( 'enabled' ) }
            optKeys={ ['enabledZoomMin','enabledZoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
        />

    </View>;

};

export default MapLayerControlMapsforge;