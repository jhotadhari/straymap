/**
 * External dependencies
 */
import {
    useContext,
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
import { debounce } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../types';
import { NumericMultiRowControl } from './generic/NumericRowControls';
import { AppContext } from '../Context';
import FileSourceRowControl from './FileSourceRowControl';
import HintLink from './generic/HintLink';
import { fillLayerConfigOptionsWithDefaults } from '../utils';

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

    const [options,setOptions] = useState<LayerConfigOptionsRasterMBtiles>(
        fillLayerConfigOptionsWithDefaults( 'hillshading', editLayer.options ) as LayerConfigOptionsRasterMBtiles
    );

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
                <Text style={ {
                    marginTop: 20,
                    ...theme.fonts.bodyLarge,
                } }>{ 'Downloads:' }</Text>
                <HintLink
                    label={ t( 'hint.link.openandromapsDownloadsRaster' ) }
                    url={ 'https://www.openandromaps.org/en/downloads/general-maps' }
                />
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