import { get } from "lodash-es";
import { Linking, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const HintLink = ( {
    label,
    url,
} : {
    label: string;
    url: string;
} ) => {
    const theme = useTheme();
    return <View key={ url } style={ { marginTop: 10 } }>
        <Text>{ label }</Text>
        <Text style={ { color: get( theme.colors, 'link' ) } } onPress={ () => Linking.openURL( url ) }>
            { url }
        </Text>
    </View>;
};

export default HintLink;