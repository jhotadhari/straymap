import { View } from "react-native";
import { Dispatch, SetStateAction } from "react";
import { MapEventResponse } from "react-native-mapsforge-vtm";

import { DashboardElementConf, UnitPref } from "../../types";
import * as dashboardElementComponents from "./elements";
import { get } from "lodash-es";

const Dashboard = ( {
    dashboardElements,
    unitPrefs,
    currentMapEvent,
    setBottomBarHeight,
} : {
    dashboardElements: DashboardElementConf[];
	unitPrefs: { [value: string]: UnitPref };
    currentMapEvent: MapEventResponse;
    setBottomBarHeight?: Dispatch<SetStateAction<number>>;
} ) => {

    return <View
        onLayout={ e => {
            const { height } = e.nativeEvent.layout;
            setBottomBarHeight ? setBottomBarHeight( height ) : null;
        } }
        style={ {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            // justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 10,
            paddingBottom: 10,
        } }
    >
        { dashboardElements && [...dashboardElements].map( ( element, index ) => {
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
            /> : null;
        } ) }
    </View>;
};

export default Dashboard;