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
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash-es';

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
            filePattern={ /.*\.mbtiles$/ }
            dirs={ appDirs ? appDirs.mapfiles : [] }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }

            filesHeading={ 'MBtiles files in' }         // ??? translate
            noFilesHeading={ 'No MBtiles files in' }    // ??? translate
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

export default MapLayerControlRasterMBTiles;