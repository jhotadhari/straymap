/**
 * External dependencies
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
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
import InfoRowControl from '../../../../../components/generic/InfoRowControl';
import LoadingIndicator from '../../../../../components/generic/LoadingIndicator';
import { stringifyProp } from '../../../../../utils';
import { FsModule } from '../../../../../nativeModules';
import { LayerConfig } from '../../types';
import { selectElementExpanded } from '../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/uiSlice';
import { selectAppDirs } from '../../../dirs/selectors';
import useCacheDirsInfo from '../../../dirs/hooks/useCacheDirsInfo';
import { CacheDir, CacheSubDir } from '../../../dirs/types';
import { getHillshadingCacheDirChild } from '../../utils';
import { selectLayers } from '../../selectors';

const CacheRow = ( {
    cacheDir,
    cache,
    findLayers,
    updateCacheDirs,
} : {
    cacheDir: CacheDir;
    cache: CacheSubDir;
    findLayers: ( pathFull: string ) => LayerConfig[];
    updateCacheDirs: () => void;
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
        [pathFull, findLayers]
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
                        updateCacheDirs();
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

const uiStateKey = 'cacheManagerExpanded';

const CacheManager = () => {

    const dispatch = useAppDispatch();

	const theme = useTheme();

    const layers = useAppSelector((state) => selectLayers(state, { temp: true }));

    const appDirs = useAppSelector( selectAppDirs );

    const internalCacheDir = useMemo( () => get( appDirs, ['internalCacheDirs',0], undefined ), [appDirs] );

    const findLayers = useCallback( ( pathFull: string ) => [...layers].filter( layer => {
        let cacheDirBase = get( layer, ['options','cacheDirBase'], undefined );
        if ( undefined === cacheDirBase ) {
            return false;
        }
        cacheDirBase = 'internal' === cacheDirBase
            ? internalCacheDir
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
    } ), [
        layers,
        internalCacheDir,
    ] );

    const expanded = useAppSelector( state => selectElementExpanded( state, uiStateKey ) );

    const {
		updateCacheDirs,
		cacheDirs,
	} = useCacheDirsInfo( expanded );

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
                updateCacheDirs();
            }
            dispatch( setElementExpanded( {
                key: uiStateKey,
                expanded: ! expanded,
            } ) );
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
                    label={ internalCacheDir === cacheDir.path ? 'Internal' : 'External' }
                >
                    <Text style={ { maxWidth: '70%'} }>{ cacheDir.path }</Text>
                </InfoRowControl>

                { [...cacheDir.caches].map( ( cache: CacheSubDir ) => <CacheRow
                    key={ cache.basename }
                    cache={ cache }
                    cacheDir={ cacheDir }
                    findLayers={ findLayers }
                    updateCacheDirs={ updateCacheDirs }
                /> ) }

            </View>;

        } ) }

    </List.Accordion>;
};

export default CacheManager;