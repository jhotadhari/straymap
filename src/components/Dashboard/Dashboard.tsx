/**
 * External dependencies
*/
import { View } from "react-native";
import { Dispatch, SetStateAction } from "react";
import { MapEventResponse } from "react-native-mapsforge-vtm";
import { get } from "lodash-es";
import { useTheme } from "react-native-paper";

/**
 * Internal dependencies
*/
import { BottomBarHeight, DashboardElementConf, DashboardStyle, UnitPref } from "../../types";
import * as dashboardElementComponents from "./elements";

const Dashboard = ( {
    elements,
    dashboardStyle,
    unitPrefs,
    currentMapEvent,
    setBottomBarHeight,
    outerWidth,
} : {
    elements: DashboardElementConf[];
    dashboardStyle: DashboardStyle;
	unitPrefs: { [value: string]: UnitPref };
    currentMapEvent: MapEventResponse;
    setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
    outerWidth: number;
} ) => {

    const theme = useTheme();
    return <View style={ {
        bottom: 0,
        position: 'absolute',
        width: outerWidth,
        // zIndex: 100,
        backgroundColor: theme.colors.background,
    } }><View
        onLayout={ e => {
            const { height } = e.nativeEvent.layout;
            setBottomBarHeight ? setBottomBarHeight( bottomBarHeight => ( {
                ...bottomBarHeight,
                dashboard: height,
            } ) ) : null;
        } }
        style={ {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: get( {
                center: 'center',
                left: 'flex-start',
                right: 'flex-end',
                around: 'space-around',
                between: 'space-between',
                evenly: 'space-evenly',
            }, dashboardStyle.align, 'center' ),
            alignItems: 'center',
            paddingTop: 10,
            paddingBottom: 10,
        } }
    >
        { elements && [...elements].map( ( element, index ) => {
            const DisplayComponent = get( dashboardElementComponents, [element.type as string,'DisplayComponent'] );
            return DisplayComponent ? <DisplayComponent
                key={ element.key || index }
                style={ {
                    paddingLeft: 10,
                    paddingRight: 10,
                } }
                dashboardElement={ element }
                currentMapEvent={ currentMapEvent }
                unitPrefs={ unitPrefs }
                dashboardStyle={ dashboardStyle }
            /> : null;
        } ) }
    </View></View>;
};

export default Dashboard;