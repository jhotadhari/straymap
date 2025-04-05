
/**
 * External dependencies
 */
import { Dispatch, SetStateAction } from "react";
import { Text, useTheme } from "react-native-paper";
import { BackHandler, View } from "react-native";
import { get } from "lodash-es";
import { sprintf } from "sprintf-js";

/**
 * Internal dependencies
 */
import { UpdateResults } from "../types";
import SplashScreen from "./SplashScreen";
import ButtonHighlight from "./generic/ButtonHighlight";
import { useTranslation } from "react-i18next";

const SplashScreenUpdater = ( {
    isUpdating,
    setIsUpdating,
} : {
    isUpdating: boolean | UpdateResults;
    setIsUpdating: Dispatch<SetStateAction<boolean | UpdateResults>>;
} ) => {

    const theme = useTheme();
    const { t } = useTranslation();
    const failedResult = Object.values( isUpdating ).find( result => 'failed' === result.state );

    return <SplashScreen
        displayLogo={ false }
        innerStyle={ { justifyContent: 'flex-start' } }
    >
        { ! failedResult && <Text>{ 'Updating the database, please wait ...' }</Text> }

        { Object.keys( isUpdating ).map( ( updatingKey: string ) => {
            const updateResult = get( isUpdating, updatingKey );
            return <View key={ updatingKey } style={ {
                marginTop: 10,
                flexDirection: 'row',
            } }>
                <Text>{ sprintf( 'Update from %s', updatingKey ) + ': ' }</Text>
                <Text style={ {
                    ...( 'success' === updateResult.state && { color: get( theme.colors, 'success' ) } ),
                    ...( 'failed' === updateResult.state && { color: theme.colors.error } ),
                } }>{ get( {
                    success: '✔ ',
                    failed: '❌ ',
                }, updateResult.state, '' ) + t( updateResult.state ) }</Text>
            </View>;
        } ) }

        { failedResult && <View style={ { marginTop: 10 } }>
            <Text style={ { marginTop: 10 } }>{ t( 'errorMsg' ) + ': ' + get( failedResult, 'msg', t( 'errorMsgFallback' ) ) }</Text>
            <Text style={ { marginTop: 10 } }>{ t( 'updaterFail' ) }</Text>
            <View style={ {
                flexDirection: 'row',
                justifyContent: 'space-between',
            } }>
                <ButtonHighlight
                    style={ { marginTop: 20, marginBottom: 40 } }
                    onPress={ () => setIsUpdating( false ) }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'primaryContainer' ) }
                    textColor={ get( theme.colors, 'onPrimaryContainer' ) }
                ><Text>{ t( 'updaterProceed' ) }</Text></ButtonHighlight>
                <ButtonHighlight
                    style={ { marginTop: 20, marginBottom: 40 } }
                    onPress={ () => BackHandler.exitApp() }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'primaryContainer' ) }
                    textColor={ get( theme.colors, 'onPrimaryContainer' ) }
                ><Text>{ t( 'updaterCloseApp' ) }</Text></ButtonHighlight>
            </View>
        </View> }
    </SplashScreen>;
};

export default SplashScreenUpdater;