/**
 * External dependencies
 */
import {
    Dispatch,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
	View,
    TouchableHighlight,
} from 'react-native';
import {
    List,
	useTheme,
    Text,
    Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { LayerConfig } from '../types';
import InfoRowControl from './generic/InfoRowControl';
import { AppContext, SettingsMapsContext } from '../Context';
import useUiState from '../compose/useUiState';
import LoadingIndicator from './generic/LoadingIndicator';
import useCacheDirsInfo, { CacheDir, CacheSubDir } from '../compose/useCacheDirsInfo';
import { getHillshadingCacheDirChild, stringifyProp } from '../utils';
import { FsModule } from '../nativeModules';

const CacheRow = ( {
    cacheDir,
    cache,
    findLayers,
    setLoadCacheDirs,
} : {
    cacheDir: CacheDir;
    cache: CacheSubDir;
    findLayers: ( pathFull: string ) => LayerConfig[];
    setLoadCacheDirs: Dispatch<SetStateAction<any>>;
} ) => {

    const [deleting,setDeleting] = useState( false );

	const { t } = useTranslation();

	const theme = useTheme();

    const pathFull = useMemo(
        () => [cacheDir.path,cache.basename].join( '/' ),
        []
    );

    const cacheLayers = useMemo(
        () => findLayers( pathFull ),
        [pathFull]
    );

    return <InfoRowControl
        key={ cache.basename }
        label={ cache.readableSize }
        labelStyle={ { marginLeft: 25, marginRight: -25 } }
    >
        <View style={ {
            maxWidth: '70%',
            flexDirection: 'row',

            justifyContent: 'space-between',
            alignItems: 'center',
        } }>

            <View style={ {
                marginRight: 10,
                flexShrink: 1,
                flexGrow: 1,
            } }>

                <Text style={ { color: theme.colors.surfaceVariant } }>{ cache.basename }</Text>

                <Text style={ { marginTop: 5 } }>{ ( cacheLayers.length
                    ? ( t( 'map.layer', { count: cacheLayers.length } ) + ': ' )
                    : t( 'noLayerUseCache' )
                ) }{ cacheLayers.length
                    ? [...cacheLayers].map( layer => layer.name ).join( ', ' )
                    : ''
                }</Text>

            </View>

            { ! deleting && <TouchableHighlight
                underlayColor={ theme.colors.elevation.level3 }
                onPress={ () => {
                    setDeleting( true );
                    FsModule.deleteDir( pathFull ).finally( () => {
                        setDeleting( false );
                        setLoadCacheDirs( Math.random() );
                    } );
                } }
                style={ { borderRadius: theme.roundness } }
            >
                <Icon
                    source="delete-outline"
                    size={ 25 }
                />
            </TouchableHighlight> }

            { deleting && <LoadingIndicator/> }

        </View>

    </InfoRowControl>;

};

const CacheManager = () => {

	const theme = useTheme();

    const {
        layers,
    } = useContext( SettingsMapsContext );

    const { appDirs } = useContext( AppContext );

    const findLayers = ( pathFull: string ) => [...layers].filter( layer => {
        let cacheDirBase = get( layer, ['options','cacheDirBase'], undefined );
        if ( undefined === cacheDirBase ) {
            return false;
        }
        cacheDirBase = 'internal' === cacheDirBase
            ? ( appDirs && appDirs?.internalCacheDir )
            : cacheDirBase;
        let cacheDirChild = '';
        switch( layer?.type ) {
            case 'hillshading':
                cacheDirChild = getHillshadingCacheDirChild( layer.options );
                break;
            case 'online-raster-xyz':
                cacheDirChild = stringifyProp( get( layer, ['options','url'], '' ) );
                break;
        }
        return [cacheDirBase,cacheDirChild].join( '/' ) === pathFull;
    } );

    const {
        value: expanded,
        setValue: setExpanded,
    } = useUiState( 'cacheManagerExpanded' );

    const [loadCacheDirs,setLoadCacheDirs] = useState<number | boolean>( expanded );

    const cacheDirs = useCacheDirsInfo( loadCacheDirs );

    return <List.Accordion
        title={ 'Cache Manager' }
        left={ props => <View style={ {
            marginLeft:   7,
            marginRight: -7,
            justifyContent: 'center',
        } }><List.Icon {...props } icon="database-outline" /></View> }
        expanded={ expanded }
        onPress={ () => {
            if ( ! expanded ) {
                setLoadCacheDirs( Math.random() );
            }
            setExpanded( ! expanded )
        } }
        titleStyle={ theme.fonts.bodyMedium }
    >

        { cacheDirs.length == 0 && <LoadingIndicator/> }

        { [...cacheDirs].map( ( cacheDir: CacheDir ) => {

            return <View key={ cacheDir.path } style={ {
                marginBottom: 10,
                marginLeft: -12,
            } }>

                <InfoRowControl
                    label={ appDirs && get( appDirs, 'internalCacheDir', '' ) === cacheDir.path ? 'Internal' : 'External' }
                >
                    <Text style={ { maxWidth: '70%'} }>{ cacheDir.path }</Text>
                </InfoRowControl>

                { [...cacheDir.caches].map( ( cache: CacheSubDir ) => <CacheRow
                    key={ cache.basename }
                    cache={ cache }
                    cacheDir={ cacheDir }
                    findLayers={ findLayers }
                    setLoadCacheDirs={ setLoadCacheDirs }
                /> ) }

            </View>;

        } ) }

    </List.Accordion>;
};

export default CacheManager;