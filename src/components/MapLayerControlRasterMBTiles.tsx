/**
 * External dependencies
 */
import {
    useContext,
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
import { debounce, get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../types';
import { NumericMultiRowControl } from './NumericRowControls';
import { AppContext } from '../Context';
import FileSourceRowControl from './FileSourceRowControl';

const MapLayerControlRasterMBTiles = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: LayerConfig;
    updateLayer: ( newItem : LayerConfig ) => void;
} ) => {

    const theme = useTheme();
	const { t } = useTranslation();

    const { appDirs } = useContext( AppContext );

    const [options,setOptions] = useState<LayerConfigOptionsRasterMBtiles>( editLayer.options as LayerConfigOptionsRasterMBtiles );

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

        <FileSourceRowControl
            header={ t( 'map.selectFile' ) }
            label={ t( 'map.file' ) }
            options={ options }
            optionsKey={ 'mapFile' }
            onSelect={ selectedOpt => setOptions( {
                ...options,
                mapFile: selectedOpt,
            } ) }
            extensions={ ['mbtiles'] }
            dirs={ appDirs ? appDirs.mapfiles : [] }
            Info={ <View>
                <Text>{ t( 'hint.maps.mbTilesFile' ) }</Text>
                <View style={ { marginTop: 10 } }>
                    <Text>{ t( 'hint.link.openandromapsDownloadsRaster' ) }</Text>
                    <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://www.openandromaps.org/en/downloads/general-maps' ) }>
                        https://www.openandromaps.org/en/downloads/general-maps
                    </Text>
                </View>
            </View> }
            filesHeading={ sprintf( t( 'filesIn' ), '(.mbtiles)' ) }
            noFilesHeading={ sprintf( t( 'noFilesIn' ), '(.mbtiles)' ) }
        />

        <NumericMultiRowControl
            label={ t( 'enabled' ) }
            optKeys={ ['enabledZoomMin','enabledZoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.enabled' ) + '\n\n' + t( 'hint.maps.zoomGeneralInfo' ) }
        />

    </View>;

};

export default MapLayerControlRasterMBTiles;