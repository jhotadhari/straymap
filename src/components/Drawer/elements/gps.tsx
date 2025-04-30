/**
 * External dependencies
 */
import React from 'react';
import {
    Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from "react-native";

const DisplayComponent = ({
    // dashboardElement,
    // style = {},
    // unitPrefs,
    // dashboardStyle,
}: {

    }) => {

    const { t } = useTranslation();

    return <View style={{
        // minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        // ...style,
    }}>
        <Text>bla gps</Text>


    </View>;
};


export default {
    key: 'gps',
    label: 'gps',
    DisplayComponent,
    // IconComponent,
    iconSource: 'crosshairs-gps',

    // ControlComponent,
    // hasStyleControl: true,
    // shouldSetHgtDirPath: true,
    // defaultMinWidth: 75,
    // responseInclude: { center: 2 },
};
