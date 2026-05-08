/**
 * External dependencies
 */
import {
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
import { debounce, get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { NumericMultiRowControl } from '../../../../../components/generic/NumericRowControls';
import FileSourceRowControl from '../../../../../components/FileSourceRowControl';
import HintLink from '../../../../../components/generic/HintLink';
import { fillLayerConfigOptionsWithDefaults } from '../../../../../utils';
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../../types';
import { selectAppDirs } from '../../../dirs/selectors';
import { useAppSelector } from '../../../../hooks';

const LayerControlRasterMBTiles = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: LayerConfig;
    updateLayer: ( newItem : LayerConfig ) => void;
} ) => {

    const theme = useTheme();
	const { t } = useTranslation();

    const appDirs = useAppSelector( selectAppDirs );

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
            dirs={ get( appDirs, 'mapfiles', [] ) }
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

export default LayerControlRasterMBTiles;