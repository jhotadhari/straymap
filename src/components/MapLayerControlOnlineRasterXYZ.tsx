/**
 * External dependencies
 */
import {
    ReactElement,
    useEffect,
    useState,
} from 'react';
import {
    Image,
    Linking,
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
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';
import { LayerConfig, LayerConfigOptionsOnlineRasterXYZ, OptionBase, ThemePropExtended } from '../types';
import { NumericRowControl, NumericMultiRowControl } from './NumericRowControls';
import InfoRowControl from './InfoRowControl';

interface SourceOption extends OptionBase {
    url?: `http://${string}` | `https://${string}`;
    Attribution?: ( { theme } : { theme: ThemePropExtended } ) => ReactElement;
}

export const sourceOptions : SourceOption[] = [
    {
        key: 'OpenStreetMap',
        label: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
        Attribution: ( { theme } : { theme: ThemePropExtended } ) => <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://www.openstreetmap.org/copyright' ) }>
            &copy; OpenStreetMap contributors
        </Text>
    },
    {
        key: 'OpenTopoMap',
        label: 'OpenTopoMap',
        url: 'https://a.tile.opentopomap.org/{Z}/{X}/{Y}.png',
        Attribution: ( { theme } : { theme: ThemePropExtended } ) => <View>
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://www.openstreetmap.org/copyright' ) }>
                &copy; OpenStreetMap contributors
            </Text>
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'http://viewfinderpanoramas.org' ) }>
                SRTM
            </Text>
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://opentopomap.org' ) }>
                Map style: &copy; OpenTopoMap
            </Text>
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://creativecommons.org/licenses/by-sa/3.0' ) }>
                CC-BY-SA
            </Text>
        </View>
    },
    {
        key: 'EsriWorldImagery',
        label: 'Esri World Imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}',
        Attribution: ( { theme } : { theme: ThemePropExtended } ) => <Text>
            Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
        </Text>
    },
    {
        key: 'GoogleMaps',
        label: 'Google Maps',
        url: 'https://mt1.google.com/vt/lyrs=r&x={X}&y={Y}&z={Z}',
        Attribution: ( { theme } : { theme: ThemePropExtended } ) => <View>
            <Image source={ theme.dark
                ? require( '../assets/images/google_on_non_white.png' )
                : require( '../assets/images/google_on_white.png' )
            } />
            <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( 'https://cloud.google.com/maps-platform/terms' ) }>
                &copy; Map data ©{ dayjs().format( 'YYYY' ) } Google
            </Text>
        </View>
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
	const [customUrl,setCustomUrl] = useState<undefined | string >( 'custom' === selectedOpt
        ? get( options, 'url', undefined )
        : undefined
    );
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

    const Attribution : null | SourceOption['Attribution'] = 'custom' === selectedOpt
        ? null
        : get( sourceOptions.find( opt => opt.url === options.url ), 'Attribution' )

    return <InfoRowControl
        label={ t( 'map.source' ) }
        Info={ t( 'hint.maps.xyzSource' ) }
        Below={ <View style={ {
            marginTop: -18,
            marginBottom: 10
        } }>
            <TextInput
                disabled={ 'custom' !== selectedOpt }
                placeholder="https://...{Z}/{X}/{Y}.png"
                underlineColor="transparent"
                multiline={ true }
                dense={ true }
                error={ ! urlIsValid }
                theme={ { fonts: { bodyLarge: {
                    ...theme.fonts.bodySmall,
                    fontFamily: "sans-serif",
                } } } }
                style={ { width: '100%' } }
                value={ 'custom' === selectedOpt
                    ? ( customUrl || '' )
                    : get( sourceOptions.find( opt => opt.key === selectedOpt ), 'url', '' ) }
                onChangeText={ newUrl => setCustomUrl( newUrl ) }
            />

            { Attribution && <View style={ { marginTop: 10 } }><Attribution theme={ theme } /></View> }
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
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.enabled' ) + '\n\n' + t( 'hint.maps.zoomGeneralInfo' ) }
        />

        <NumericMultiRowControl
            label={ 'Zoom' }
            optKeys={ ['zoomMin','zoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.zoom' ) + '\n\n' + t( 'hint.maps.zoomGeneralInfo' ) }
        />

        <NumericRowControl
            label={ t( 'cacheSize' ) }
            optKey={ 'cacheSize' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            // Info={ t( 'hint.maps.cacheSize' ) }  // ??? is the cache working at all ???
        />

    </View>;

};

export default MapLayerControlOnlineRasterXYZ;