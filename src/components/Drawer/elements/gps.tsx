/**
 * External dependencies
 */
import React, {
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    Icon,
	Menu,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { View } from "react-native";
import convertUnits from "convert-units";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../generic/ButtonHighlight';
import MenuItem from '../../generic/MenuItem';
import InfoRowControl from '../../generic/InfoRowControl';
import { options as unitPrefControlOptions } from '../../UnitPrefControl';
import { DashboardDisplayComponentProps, DashboardElementConf, UnitPref } from "../../../types";
import { TFunction } from 'i18next';
import { roundTo } from '../../../utils';
import { NumericRowControl } from '../../generic/NumericRowControls';
import { AppContext } from '../../../Context';
import { defaults } from '../../../constants';
import { styles as mdStyles } from '../../../markdown/styles';


const DisplayComponent = ( {
    // currentMapEvent,
    // dashboardElement,
    // style = {},
    // unitPrefs,
    // dashboardStyle,
} : {

} ) => {

    const { t } = useTranslation();

    return <View style={ {
        // minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        // ...style,
    } }>
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
