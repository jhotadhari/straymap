/**
 * External dependencies
 */
import {
    ReactNode,
} from 'react';
import {
	View,
} from 'react-native';
import {
	useTheme,
    Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';

const InfoControlWrapper = ( {
    label,
    labelPattern = 'whatIs',
    children,
    Info,
    Below,
    backgroundBlur = false,
    headerPlural = false,
    modalVisible,
    setModalVisible,
} : {
    label?: string;
    labelPattern?: string,
    children: ReactNode;
    Info?: ReactNode | string;
    Below?: ReactNode;
    backgroundBlur?: boolean,
    headerPlural?: boolean,
    modalVisible: boolean,
    setModalVisible: ( visible : boolean ) => void,
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
    return <View>
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ !! backgroundBlur }
            onDismiss={ () => setModalVisible( false ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
            header={ sprintf( t( labelPattern, { count: headerPlural ? 0 : 1 } ), ( label || '' ) ) }
        >
            <View style={ { marginTop: 20, marginBottom: 20 } }>
                { Info && 'string' === typeof Info && <Text>{ Info }</Text> }
                { Info && 'string' !== typeof Info && Info }
            </View>

            <ButtonHighlight
                style={ { marginTop: 20, marginBottom: 40 } }
                onPress={ () => setModalVisible( false ) }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'gotIt' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        { children }

        { Below }
    </View>;
};

export default InfoControlWrapper;