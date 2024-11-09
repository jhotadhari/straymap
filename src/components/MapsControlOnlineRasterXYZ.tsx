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
    Menu,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';
import { OptionBase } from '../types';


const sourceOptions : OptionBase[] = [
    'osm',
    'opentopomaps',
    'google',
    'esrisat',
].map( key => ( {
    key,
    label: 'map.bla???.' + key,
} ) );

const MapsControlOnlineRasterXYZ = () => {



	const { t } = useTranslation();
    const theme = useTheme();


    return <View>


        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            <Text style={ { minWidth: 100 } }>{ t( 'Source???' ) }</Text>

            <Menu
            contentStyle={ {
                borderColor: theme.colors.outline,
                borderWidth: 1,
            } }
            // style={ { minWidth: ( layout.x + layout.width - 40 ) / 2 } }
            visible={ false }
            // onDismiss={ () => setVisible( false ) }

            style={ {
                // transform: [
                //     { translateX:  }
                // ]

                // marginLeft: 120
            } }
            anchor={ <ButtonHighlight
                // onPress={ () => {
                //     setValue( opt.key );
                //     setVisible( false );
                // mode="contained"
                // } }
            ><Text>{ t( 'value???' ) }</Text></ButtonHighlight> }
        >
            { sourceOptions && [...sourceOptions].map( opt => <MenuItem
                key={ opt.key }
                style={ {
                    // transform: [
                    //     { translateX:  }
                    // ]

                    // paddingLeft: 100
                } }
                // onPress={ () => {
                //     setValue( opt.key );
                //     setVisible( false );
                // } }
                title={ t( opt.label ) }
                // active={ opt.key === value }
            /> ) }
        </Menu>

        </View>




        {/*
        source url
        zoomMin
        zoomMax
        cacheSize */}

    </View>;

};

export default MapsControlOnlineRasterXYZ;