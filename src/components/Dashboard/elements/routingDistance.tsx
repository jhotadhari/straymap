/**
 * External dependencies
 */
import React, { useContext } from 'react';
import {
	Text,
} from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from "react-native";

/**
 * Internal dependencies
 */
import { DashboardDisplayComponentProps } from "../../../types";
import { AppContext, RoutingContext } from '../../../Context';
import { formatDistance } from '../../../utils';

const DisplayComponent = ( {
    dashboardElement,
    style = {},
    dashboardStyle,
} : DashboardDisplayComponentProps ) => {

    let fontSize = get( dashboardElement, ['style','fontSize'], 'default' );
    fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

    const {
        generalSettings,
    } = useContext( AppContext );

    const {
        isRouting,
        stats,
    } = useContext( RoutingContext );

    return isRouting ? <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        <Text style={ { fontSize } }>{ generalSettings && formatDistance( stats?.distance || 0, generalSettings?.unitPrefs.distance ) }</Text>
    </View> : null;
};

export default {
    key: 'routingDistance',
    label: 'routingDistance',   // ???
    DisplayComponent,
    ControlComponent: null,
    hasStyleControl: true,
    defaultMinWidth: 75,
};
