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

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';
import { MapConfig, MapConfigOptionsOnlineRasterXYZ, OptionBase } from '../types';
import { debounce, get } from 'lodash-es';


interface SourceOption extends OptionBase {
    url?: `http://${string}` | `https://${string}`;
    attribution?: ( { style } : { style: TextStyle} ) => ReactNode;
}

const sourceOptions : SourceOption[] = [

    {
        key: 'OpenStreetMap',
        label: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
        // maxZoom: 19,
        attribution: ( { style } ) => <Text style={ style } onPress={ () => Linking.openURL( 'https://www.openstreetmap.org/copyright' ) }>
            &copy; OpenStreetMap contributors
        </Text>
    },
    {
        key: 'OpenTopoMap',
        label: 'OpenTopoMap',
        url: 'https://a.tile.opentopomap.org/{Z}/{X}/{Y}.png',
	    // maxZoom: 17,
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
	    // maxZoom: 17,
        attribution: ( { style } ) => <Text style={ style }>
            Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community
        </Text>
    },
    {
        key: 'GoogleMaps',
        label: 'Google Maps',
        url: 'https://mt1.google.com/vt/lyrs=r&x={X}&y={Y}&z={Z}',
        // maxZoom: 19,
        attribution: ( { style } ) => <Text style={ style } onPress={ () => Linking.openURL( 'https://cloud.google.com/maps-platform/terms' ) }>
            &copy; Map data ©2024 Google ... logo missing! sorry
        </Text>
    },
    {
        key: 'custom',
        label: 'custom',
    },


];

const labelMinWidth = 90;


const SourceControl = ( {
    options,
    setOptions,
} : {
    options: MapConfigOptionsOnlineRasterXYZ;
    setOptions: ( options : MapConfigOptionsOnlineRasterXYZ ) => void;
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

    return <View>
        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            <Text style={ { minWidth: labelMinWidth } }>{ t( 'map.source' ) }:</Text>
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
        </View>

        <View style={ { flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: 10 } }>
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
        </View>
    </View>;
};

const NumericControl = ( {
    label,
    optKey,
    options,
    setOptions,
} : {
    label: string;
    optKey: string;
    options: MapConfigOptionsOnlineRasterXYZ;
    setOptions: ( options : MapConfigOptionsOnlineRasterXYZ ) => void;
} ) => {

    const theme = useTheme();
    return <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
        <Text style={ { minWidth: labelMinWidth + 12 } }>{ label }</Text>
        <TextInput
            style={ { flexGrow: 1 } }
            underlineColor="transparent"
            dense={ true }
            theme={ { fonts: { bodyLarge: {
                ...theme.fonts.bodySmall,
                fontFamily: "sans-serif",
            } } } }
            onChangeText={ newVal => setOptions( { ...options, [optKey]: parseInt( newVal.replace(/[^0-9]/g, ''), 10 ) } ) }
            value={ get( options, optKey, '' ) + '' }
            keyboardType='numeric'
        />
    </View>;
};


const MapsControlOnlineRasterXYZ = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: MapConfig;
    updateLayer: ( newItem : MapConfig ) => void;
} ) => {

	const { t } = useTranslation();

    const [options,setOptions] = useState<MapConfigOptionsOnlineRasterXYZ>( editLayer.options );

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

        <SourceControl
            options={ options }
            setOptions={ setOptions }
        />

        <NumericControl
            label={ 'Zoom min' }
            optKey={ 'zoomMin' }
            options={ options }
            setOptions={ setOptions }
        />

        <NumericControl
            label={ 'Zoom max' }
            optKey={ 'zoomMax' }
            options={ options }
            setOptions={ setOptions }
        />

        <NumericControl
            label={ t( 'cacheSize' ) }
            optKey={ 'cacheSize' }
            options={ options }
            setOptions={ setOptions }
        />

    </View>;

};

export default MapsControlOnlineRasterXYZ;