
/**
 * External dependencies
 */
import { Dispatch, FC, SetStateAction } from "react";
import { Text, useTheme } from "react-native-paper";
import { BackHandler, View } from "react-native";
import { get } from "lodash-es";
import { sprintf } from "sprintf-js";

/**
 * Internal dependencies
 */
import SplashScreen from "./SplashScreen";
import ButtonHighlight from "./generic/ButtonHighlight";
import { useTranslation } from "react-i18next";
import { UpdateResults } from "../store/features/general/types";
import { selectInstalledVersion } from "../store/features/general/selectors";
import { useAppSelector } from "../store/hooks";
import packageJson from '../../package.json';

const FailControls : FC<{
    setIsUpdating: Dispatch<SetStateAction<boolean | UpdateResults | 'isDowngrade'>>;
}> = ( {
    setIsUpdating,
} ) => {

    const theme = useTheme();
    const { t } = useTranslation();

    return <View>
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
    </View>;
};

const SplashScreenUpdater = ( {
    isUpdating,
    setIsUpdating,
} : {
    isUpdating: boolean | UpdateResults | 'isDowngrade';
    setIsUpdating: Dispatch<SetStateAction<boolean | UpdateResults | 'isDowngrade'>>;
} ) => {

    console.log( 'debug isUpdating', isUpdating ); // debug

    const installedVersionStore = useAppSelector( selectInstalledVersion );


    const theme = useTheme();
    const { t } = useTranslation();
    const failedResult = 'object' === typeof isUpdating && Object.values( isUpdating ).find( result => 'failed' === result.state );

    return <SplashScreen
        displayLogo={ false }
        innerStyle={ { justifyContent: 'flex-start' } }
    >
        { ! failedResult && 'isDowngrade' !== isUpdating && <Text>{ 'Updating the database, please wait ...' }</Text> }

        { 'object' === typeof isUpdating && Object.keys( isUpdating ).map( ( updatingKey: string ) => {
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

        { failedResult && isUpdating && <View style={ { marginTop: 10 } }>
            <Text style={ { marginTop: 10 } }>{ t( 'errorMsg' ) + ': ' + get( failedResult, 'msg', t( 'errorMsgFallback' ) ) }</Text>
            <FailControls setIsUpdating={ setIsUpdating }/>
        </View> }

        { 'isDowngrade' === isUpdating && <View style={ { marginTop: 10 } }>
            <Text style={ { marginTop: 10 } }>{ t( 'The app got downgraded. The last installed version is higher than the current version.' ) }</Text>
            <Text style={ { marginTop: 10 } }>{ sprintf( t( 'Last installed version: %s' ), installedVersionStore ) }</Text>
            <Text style={ { marginTop: 10 } }>{ sprintf( t( 'Current version: %s' ), packageJson.version ) }</Text>
            <FailControls setIsUpdating={ setIsUpdating }/>
        </View> }

    </SplashScreen>;
};

export default SplashScreenUpdater;