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
    // currentMapEvent,
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
        <Text>bla iOverlander</Text>


    </View>;
};

export default {
    key: 'ioverlander',
    label: 'iOverlander',
    DisplayComponent,
    // IconComponent,
    iconSource: 'routes',

    // ControlComponent,
    // hasStyleControl: true,
    // shouldSetHgtDirPath: true,
    // defaultMinWidth: 75,
    // responseInclude: { center: 2 },
};
