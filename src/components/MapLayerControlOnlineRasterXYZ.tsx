/**
 * External dependencies
 */
import {
    ReactNode,
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
    Menu,
    useTheme,
    TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ, OptionBase } from '../types';
import { NumericRowControl, NumericMultiRowControl } from './NumericRowControls';
import InfoRowControl from './InfoRowControl';


interface SourceOption extends OptionBase {
    url?: `http://${string}` | `https://${string}`;
    attribution?: ( { style } : { style: TextStyle} ) => ReactNode;
}

const sourceOptions : SourceOption[] = [

    {
        key: 'OpenStreetMap',
        label: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
        // zoomMax: 19,
        attribution: ( { style } ) => <Text style={ style } onPress={ () => Linking.openURL( 'https://www.openstreetmap.org/copyright' ) }>
            &copy; OpenStreetMap contributors
        </Text>
    },
    {
        key: 'OpenTopoMap',
        label: 'OpenTopoMap',
        url: 'https://a.tile.opentopomap.org/{Z}/{X}/{Y}.png',
	    // zoomMax: 17,
        attribution: ( { style } ) => <View>
            <Text style={ style } onPress={ () => Linking.openURL( 'https://www.openstreetmap.org/copyright' ) }>
                &copy; OpenStreetMap contributors
            </Text>
            <Text style={ style } onPress={ () => Linking.openURL( 'http://viewfinderpanoramas.org' ) }>
                SRTM
            </Text>
            <Text style={ style } onPress={ () => Linking.openURL( 'https://opentopomap.org' ) }>
                Map style: &copy; OpenTopoMap
            </Text>
            <Text style={ style } onPress={ () => Linking.openURL( 'https://creativecommons.org/licenses/by-sa/3.0' ) }>
                CC-BY-SA
            </Text>
        </View>
    },
    {
        key: 'EsriWorldImagery',
        label: 'Esri World Imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}',
	    // zoomMax: 17,
        attribution: ( { style } ) => <Text style={ style }>
            Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
        </Text>
    },
    {
        key: 'GoogleMaps',
        label: 'Google Maps',
        url: 'https://mt1.google.com/vt/lyrs=r&x={X}&y={Y}&z={Z}',
        // zoomMax: 19,
        attribution: ( { style } ) => <Text style={ style } onPress={ () => Linking.openURL( 'https://cloud.google.com/maps-platform/terms' ) }>
            &copy; Map data ©2024 Google ... logo missing! sorry
        </Text>
    },
    {
        key: 'custom',
        label: 'custom',
    },
];

const SourceRowControl = ( {
    options,
    setOptions,
} : {
    options: LayerConfigOptionsOnlineRasterXYZ;
    setOptions: ( options : LayerConfigOptionsOnlineRasterXYZ ) => void;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [selectedOpt,setSelectedOpt] = useState( options.url
        ? get( sourceOptions.find( opt => opt.url === options.url ), 'key', 'custom' )
        : sourceOptions[0].key
    );
	const [customUrl,setCustomUrl] = useState<undefined | string >( undefined );
	const [menuVisible,setMenuVisible] = useState( false );

    let urlIsValid = selectedOpt !== 'custom' || (
        'string' === typeof customUrl
        && /^https?:\/\//.test( customUrl )
        && /{X}/.test( customUrl )
        && /{Y}/.test( customUrl )
        && /{Z}/.test( customUrl )
    );

    const doUpdate = debounce( () => {
        if ( urlIsValid ) {
            setOptions( {
                ...options,
                url: selectedOpt === 'custom' ? customUrl : get( sourceOptions.find( opt => opt.key === selectedOpt ), 'url', '' ),
            } );
        }
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [urlIsValid, selectedOpt, customUrl] );

    return <InfoRowControl
            label={ t( 'map.source' ) }
            // Info={ Info }
            Info={ <Text>{ 'bla bla ??? info text' }</Text> }
            Below={ <View style={ { flexDirection: 'row', alignItems: 'center', marginTop: -18, marginBottom: 10 } }>
            <TextInput
                disabled={ 'custom' !== selectedOpt }
                placeholder="https://...{Z}/{X}/{Y}.png"
                underlineColor="transparent"
                dense={ true }
                error={ ! urlIsValid }
                theme={ { fonts: { bodyLarge: {
                    ...theme.fonts.bodySmall,
                    fontFamily: "sans-serif",
                } } } }
                style={ { width: '100%' } }
                value={ 'custom' === selectedOpt ? ( customUrl || '' ) : get( sourceOptions.find( opt => opt.key === selectedOpt ), 'url', '' ) }
                onChangeText={ newUrl => setCustomUrl( newUrl ) }
            />
        </View> }
    >
        <Menu
            contentStyle={ {
                borderColor: theme.colors.outline,
                borderWidth: 1,
            } }
            visible={ menuVisible }
            onDismiss={ () => setMenuVisible( false ) }
            anchor={ <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setMenuVisible( true ) } >
                <Text>{ t( get( sourceOptions.find( opt => opt.key === selectedOpt ), 'label', '' ) ) }</Text>
            </ButtonHighlight> }
        >
            { sourceOptions && [...sourceOptions].map( opt => <MenuItem
                key={ opt.key }
                onPress={ () => {
                    setSelectedOpt( opt.key );
                    setMenuVisible( false );
                } }
                title={ t( opt.label ) }
                active={ opt.key === selectedOpt }
            /> ) }
        </Menu>
    </InfoRowControl>;

};

const MapLayerControlOnlineRasterXYZ = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: LayerConfig;
    updateLayer: ( newItem : LayerConfig ) => void;
} ) => {

	const { t } = useTranslation();

    const [options,setOptions] = useState<LayerConfigOptionsOnlineRasterXYZ>( editLayer.options as LayerConfigOptionsOnlineRasterXYZ );

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
        />

        <NumericMultiRowControl
            label={ t( 'enabled' ) }
            optKeys={ ['enabledZoomMin','enabledZoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
        />

        <NumericMultiRowControl
            label={ 'Zoom' }
            optKeys={ ['zoomMin','zoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            Info={ <Text>{ 'bla bla ??? info text' }</Text> }
        />

        <NumericRowControl
            label={ t( 'cacheSize' ) }
            optKey={ 'cacheSize' }
            options={ options }
            setOptions={ setOptions }
            Info={ <Text>{ 'bla bla ??? info text' }</Text> }
        />

    </View>;

};

export default MapLayerControlOnlineRasterXYZ;