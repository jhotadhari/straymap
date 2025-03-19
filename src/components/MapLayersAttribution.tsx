
/**
 * External dependencies
 */
import React, { ReactElement, useContext } from 'react';
import { View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { AppContext } from '../Context';
import { LayerConfig, LayerInfo, LayerInfos, ThemePropExtended } from '../types';
import { useTranslation } from 'react-i18next';
import InfoButton from './InfoButton';
import { sourceOptions } from './MapLayerControlOnlineRasterXYZ';

type AttributionConf = {
    key: string;
    name: string;
    type: string;
    Component: ( { theme } : { theme: ThemePropExtended } ) => ReactElement;
};

const LayerInfoComponent = ( {
    layerInfo,
} : {
    layerInfo: null | LayerInfo;
} ) => {
    const { t } = useTranslation();
    if ( ! layerInfo ) {
        return null;
    }
    return <View>
        { Object.keys( layerInfo ).map( key => {
            if ( ! get( layerInfo, key ) ) {
                return null;
            }
            return <View key={ key }>
                <Text>{ 'createdBy' === key
                    ? t( 'createdBy' ) + ': '
                    : '' }{ get( layerInfo, key ) }</Text>
            </View>;
        } ) }
    </View>;
};

const Inner = ( {
    layerInfos,
} : {
    layerInfos: LayerInfos;
} ) => {
    const { t } = useTranslation();
	const theme = useTheme();
    const {
		mapSettings,
    } = useContext( AppContext );
    if ( ! mapSettings ) {
        return null;
    }
    const attributions : AttributionConf[] = [...mapSettings.layers].filter( layer => {
        return layer.type && layer.visible;
    } ).map( ( layer : LayerConfig ) => {
        switch( layer.type ) {
            case 'online-raster-xyz':
                return {
                    key: layer.key,
                    name: layer.name,
                    type: layer.type,
                    Component: get(
                        sourceOptions.find( opt => opt.url === get( layer.options, 'url', '' ) ),
                        'Attribution',
                        false
                    ),
                };
            case 'raster-MBtiles':
            case 'mapsforge':
                return {
                    key: layer.key,
                    name: layer.name,
                    type: layer.type,
                    Component: () => <LayerInfoComponent layerInfo={ get( layerInfos, layer.key ) }/>
                };
            case 'hillshading':
                // no idea how to get some info. Let's skip that.
                break;
        }
        return false;
    } ).filter( a => !! a && !! a.Component ) as AttributionConf[];

    return <View>
        { [...attributions].map( ( attribution, index ) => {
            const Component = attribution.Component;
            return <View
                key={ attribution.key }
                style={ index + 1 !== attributions.length ? { marginBottom: 25 } : {} }
            >
                <Text>{ t( 'map.layer', { count: 1 } ) }: { attribution.name }</Text>
                <Text>({ attribution.type })</Text>
                <View style={ { marginLeft: 10, marginTop: 10 } } >
                    <Component theme={ theme }/>
                </View>
            </View>;
        } ) }
    </View>;
};

const PADDING = 8;  // see node_modules/react-native-paper/src/components/IconButton/IconButton.tsx

const buttonSize = 18;

const MapLayersAttribution = ( {
    layerInfos,
} : {
    layerInfos: LayerInfos;
} ) => {

	const theme = useTheme();
    const { t } = useTranslation();

	return <View
		style={ {
			position: 'absolute',
			bottom: 0 + PADDING + 3,
			right: 0 + PADDING + 6,
			justifyContent: 'center',
			alignItems: 'center',
			width: buttonSize,
			height: buttonSize,
		} }
	>
        <InfoButton
            labelPattern={ t( 'layerAttributions' ) }
            headerPlural={ true }
            backgroundBlur={ true }
            Info={ <Inner
                layerInfos={ layerInfos }
            /> }
            buttonProps={ {
                style: {
                    borderColor: theme.colors.background,
                    marginTop: 0,
                    marginBottom: 0,
                },
                size: buttonSize,
                icon: ( { color } ) => <Icon
                    source="information-variant"
                    color={ color }
                    size={ buttonSize * 1.5 }
                />,
                mode: "outlined",
                iconColor: theme.dark
                    ? theme.colors.background
                    : theme.colors.onBackground,
            } }
        />

	</View>;
};

export default MapLayersAttribution;
