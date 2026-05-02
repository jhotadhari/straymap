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
import { RoutingContext } from '../../../Context';
import { formatDistance } from '../../../utils';
import { useAppSelector } from '../../../store/hooks';
import { selectUnitPrefs } from '../../../store/features/general/selectors';
import { DashboardDisplayComponentProps } from '../../../store/features/dashboard/types';

const DisplayComponent = ( {
    dashboardElement,
    style = {},
    dashboardStyle,
} : DashboardDisplayComponentProps ) => {

    const unitPrefs = useAppSelector( selectUnitPrefs );

    let fontSize = get( dashboardElement, ['style','fontSize'], 'default' );
    fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

    const {
        isRouting,
        stats,
    } = useContext( RoutingContext );

    return isRouting ? <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        <Text style={ { fontSize } }>{ formatDistance( stats?.distance || 0, unitPrefs.distance ) }</Text>
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
