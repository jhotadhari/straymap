/**
 * External dependencies
 */
import React from 'react';
import {
	Text,
} from 'react-native-paper';
import { get } from 'lodash-es';
import { View } from "react-native";

/**
 * Internal dependencies
 */
import { DashboardDisplayComponentProps } from "../../../types";

const DisplayComponent = ( {
    currentMapEvent,
    dashboardElement,
    style = {},
} : DashboardDisplayComponentProps ) => {
    return <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        { currentMapEvent.zoomLevel && <Text style={ {
            fontSize: get( dashboardElement, ['style','fontSize'], undefined ),
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
