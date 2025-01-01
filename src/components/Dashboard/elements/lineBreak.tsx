/**
 * External dependencies
 */
import React from 'react';
import { View } from "react-native";

/**
 * Internal dependencies
 */
import { DashboardDisplayComponentProps } from "../../../types";

const DisplayComponent = ( {
    style = {},
} : DashboardDisplayComponentProps ) => {
    return <View
        style={ {
            width: '100%',
            height: 0,
            ...style,
        } }
    />;
};

export default {
    key: 'lineBreak',
    label: 'lineBreak',
    DisplayComponent,
    ControlComponent: null,
    hasStyleControl: false,
    defaultWidth: 75,
    responseInclude: {},
};
