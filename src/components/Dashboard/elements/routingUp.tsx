/**
 * External dependencies
 */
import React, { useContext } from 'react';
import {
    Icon,
	Text,
} from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from "react-native";

/**
 * Internal dependencies
 */
import { DashboardDisplayComponentProps } from "../../../types";
import { RoutingContext } from '../../../Context';

const DisplayComponent = ( {
    dashboardElement,
    style = {},
    dashboardStyle,
} : DashboardDisplayComponentProps ) => {

    let fontSize = get( dashboardElement, ['style','fontSize'], 'default' );
    fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

    const {
        isRouting,
        stats,
    } = useContext( RoutingContext );

    return isRouting ? <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        flexDirection: 'row',
        alignItems: 'center',
        ...style,
    } }>
        <Icon
            source="arrow-up"
            size={ 17 }
        /><Text style={ { marginLeft: 5, fontSize } }>{ Math.round( stats?.up || 0  ) + ' m' }</Text>
    </View> : null;
};

export default {
    key: 'routingUp',
    label: 'routingUp',   // ???
    DisplayComponent,
    ControlComponent: null,
    hasStyleControl: true,
    defaultMinWidth: 75,
};
