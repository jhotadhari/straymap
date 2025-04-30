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
import { MapContext } from '../../../Context';

const DisplayComponent = ( {
    dashboardElement,
    style = {},
    dashboardStyle,
} : DashboardDisplayComponentProps ) => {

    const {
		currentMapEvent,
    } = useContext( MapContext );

    let fontSize = get( dashboardElement, ['style','fontSize'], 'default' );
    fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

    return <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        { currentMapEvent && undefined !== currentMapEvent?.zoomLevel && <Text style={ {
            fontSize,
        } }>{ currentMapEvent.zoomLevel }</Text>  }
    </View>;
};

export default {
    key: 'zoomLevel',
    label: 'zoomLevel',
    DisplayComponent,
    ControlComponent: null,
    hasStyleControl: true,
    defaultMinWidth: 75,
    responseInclude: { zoomLevel: 2 },
};
