import { View } from "react-native";
import { useState } from "react";
import { SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { MapEventResponse } from "react-native-mapsforge-vtm";
import { clamp } from "lodash-es";

import Drawer from "./Drawer";
import { DrawerState } from "../../types";

const useDrawerState = ({
    side,
    drawerWidth = 300,
    outerWidth,
    translationX,
    translationXOther,
}: {
    side: string;
    drawerWidth?: number;
    outerWidth: number;
    translationX: SharedValue<number>;
    translationXOther: SharedValue<number>;
}): DrawerState => {

    drawerWidth = drawerWidth <= outerWidth * 2 / 3
        ? drawerWidth
        : outerWidth * 2 / 3;

    const prevTranslationX = useSharedValue('left' === side ? - drawerWidth : drawerWidth);

    const [showInner, setShowInner] = useState(false);

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ translateX: translationX.value }],
    }));

    const setTranslationX = (newVal: number) => {
        translationX.value = newVal;
        // Render inner on initial open.
        if (!showInner) {
            setShowInner(true);
        }
        // Maybe shrink other
        const remaining = 'left' === side
            ? outerWidth - newVal - drawerWidth
            : outerWidth + newVal - drawerWidth;
        const remainingOther = 'left' === side
            ? outerWidth + translationXOther.value - drawerWidth
            : outerWidth - translationXOther.value - drawerWidth;
        if (remaining - (outerWidth - remainingOther) < outerWidth / 3) {
            translationXOther.value = clamp(
                'right' === side
                    ? newVal - (outerWidth * 2 / 3)
                    : newVal + (outerWidth * 2 / 3),
                'right' === side ? - drawerWidth : 0,
                'right' === side ? 0 : drawerWidth
            );
        }
    };

    const expand = (expanded: boolean) => setTranslationX(expanded
        ? ('left' === side ? 0 : 0)
        : ('left' === side ? - drawerWidth : drawerWidth)
    );

    const gesture = Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
            prevTranslationX.value = translationX.value;
        })
        .onUpdate((event) => {
            setTranslationX(clamp(
                prevTranslationX.value + event.translationX,
                'left' === side ? - drawerWidth : 0,
                'left' === side ? 0 : drawerWidth
            ));
        })
        .runOnJS(true);

    const getIsFullyCollapsed = () => 'left' === side
        ? translationX.value === - drawerWidth
        : translationX.value === drawerWidth;

    return {
        side,
        drawerWidth,
        outerWidth,
        showInner,
        gesture,
        animatedStyles,
        expand,
        getIsFullyCollapsed,
    };

};

const Drawers = ({
    drawerWidth = 300,
    outerWidth,
    height,
}: {
    drawerWidth?: number;
    outerWidth: number;
    height: number;
}) => {

    const translationXLeft = useSharedValue(- drawerWidth);

    const translationXRight = useSharedValue(drawerWidth);

    const drawerStateLeft = useDrawerState({
        side: 'left',
        drawerWidth,
        outerWidth,
        translationX: translationXLeft,
        translationXOther: translationXRight,
    });

    const drawerStateRight = useDrawerState({
        side: 'right',
        drawerWidth,
        outerWidth,
        translationX: translationXRight,
        translationXOther: translationXLeft,
    });

    return <View style={{ position: 'absolute' }}>

        <Drawer
            elements={[
                {
                    type: 'gps',
                },
                {
                    type: 'tracksRoutes',
                },
                {
                    type: 'waypoints',
                },
            ]}
            drawerState={drawerStateLeft}
            height={height}
        />

        <Drawer
            elements={[
                {
                    type: 'maps',
                },
                {
                    type: 'searchPlace',
                },
                {
                    type: 'brouter',
                },
            ]}
            drawerState={drawerStateRight}
            height={height}
        />

    </View>;

};


export default Drawers;