/**
 * External dependencies
 */
import React, { useContext, useState } from 'react';
import {
    Button,
    Icon,
    Menu,
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { TextStyle, View, ViewStyle } from "react-native";
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import IconIcomoon from '../../generic/IconIcomoon';
import { AppContext } from '../../../Context';
import { pick } from 'lodash-es';
import MenuItem from '../../generic/MenuItem';
import { MapEventResponse } from 'react-native-mapsforge-vtm';
import formatcoords from 'formatcoords';

const DisplayComponent = ({
    // currentMapEvent,
    // dashboardElement,
    // style = {},
    // unitPrefs,
    // dashboardStyle,
}: {

} ) => {


    const {
        routingPoints,
        routingSegments,
    } = useContext( AppContext );

    const { t } = useTranslation();


    console.log( 'debug routingSegments', routingSegments ); // debug
    return <View style={{
        // minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        // ...style,
    }}>
        { routingPoints && [...routingPoints].map( ( point, index ) => {

            const segment = routingSegments ? routingSegments.find( segment =>
                segment.fromId === point.id
            ) : undefined;

            return <View key={ index } style={ { marginBottom: 10 } }>

                <View style={ { flexDirection: 'row' } }>

                    <Text style={ { marginRight: 10 } }>{ index }</Text>

                    <Text>{ formatcoords( point.location ).format( 'dd',{
                        decimalPlaces: 4,
                    } ) }</Text>

                </View>

                { segment && <View style={ { } }>
                    {/* <Text>ok</Text> */}
                    { segment?.errorMsg && <Text style={ { } }>{ 'Error' + ': ' + segment?.errorMsg }</Text> }
                    { segment?.isFetching && <Text style={ { } }>{ 'fetching...' }</Text> }
                    { ! segment?.isFetching && segment?.positions && <Text style={ { } }>{ 'positions' + ': ' + segment?.positions.length }</Text> }
                </View> }

            </View>;
        } ) }
    </View>;
};

const IconComponent = ({ color }: { color: string }) => {
    return <IconIcomoon style={{ color }} name="routes_search" size={25} />;
};

const IconActions = ( {
    style,
    currentMapEvent,
} : {
    style: TextStyle,
    currentMapEvent: MapEventResponse;
}) => {

    const theme = useTheme();
    const { t } = useTranslation();
    const [menuVisible,setMenuVisible] = useState( false );

    const {
        routingPoints,
        setRoutingPoints,
    } = useContext( AppContext );

    const options = [
        {
            value: 'appendPoint',
            label: 'appendPoint',
            onPress: () => {
				setMenuVisible( false );
                if ( setRoutingPoints && routingPoints && currentMapEvent?.center ) {
                    setRoutingPoints( [
                        ...routingPoints,
                        {
                            id: rnUuid.v4(),
                            location: currentMapEvent?.center,
                        }
                    ] );
                }
			},
        },
        {
            value: 'deleteLastPoint',
            label: 'deleteLastPoint',
            onPress: () => {
				setMenuVisible( false );
                if ( setRoutingPoints && routingPoints && routingPoints.length > 0 ) {
                    const newPoints = [...routingPoints];
                    newPoints.splice( -1, 1 );
                    setRoutingPoints( newPoints );
                }
			},
        },
    ];

    return <Menu
        contentStyle={ {
            borderColor: theme.colors.outline,
            borderWidth: 1,
            marginLeft: -30,
            marginTop: -5,
        } }
        visible={ menuVisible }
        onDismiss={ () => setMenuVisible( false ) }
        anchor={ <Button
            onPress={ () => setMenuVisible( true ) }
            style={ style }
        >
            <Icon
                source={ 'menu' }
                size={ 25 }
                color={ style?.color as string | undefined }
            />
        </Button> }
    >
        { options && [...options].map( opt => <MenuItem
			key={ opt.value }
            // style={ {
            //     // transform: [{ translateX: - 20 }],
            //     // marginLeft: -30,
            //     // marginRight: -30,
            //     // paddingRight: 20,
            // } }
			onPress={ opt.onPress }
			title={ t( opt.label ) }
			// active={ opt.key === value }
		/> ) }




    </Menu>;
};

export default {
    key: 'brouter',
    label: 'brouter',
    DisplayComponent,
    IconComponent,
    IconActions,

    // ControlComponent,
    // hasStyleControl: true,
    // shouldSetHgtDirPath: true,
    // defaultMinWidth: 75,
    // responseInclude: { center: 2 },
};
