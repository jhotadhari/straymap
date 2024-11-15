
/**
 * External dependencies
 */
import {
    ReactNode,
    useState,
} from 'react';
import {
	View,
    TouchableHighlight,
} from 'react-native';
import {
	useTheme,
    Text,
    Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';

const labelMinWidth = 90;

const labelPadding = {
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 4,
};

const InfoRowControl = ( {
    label,
    children,
    Info,
    Below,
} : {
    label?: string;
    children: ReactNode;
    Info?: ReactNode;
    Below?: ReactNode;
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [modalVisible, setModalVisible] = useState( false );
    return <View>
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            header={  sprintf( t( 'whatIs' ), ( label || '' ) ) }
            headerPrepend={ <View style={ { marginRight: 10 } }><Icon
                source="information-outline"
                size={ 25 }
            /></View> }
        >
            <View style={ { marginTop: 20, marginBottom: 20 } }>
                { Info && Info }
            </View>

            <ButtonHighlight
                style={ { marginTop: 20 } }
                onPress={ () => setModalVisible( false ) }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'gotIt' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
            { Info && <TouchableHighlight
                underlayColor={ theme.colors.elevation.level3 }
                onPress={ () => setModalVisible( true ) }
                style={ { borderRadius: theme.roundness } }
            >
                <Text style={ { ...labelPadding, minWidth: labelMinWidth + 12 } }>{ label }</Text>
            </TouchableHighlight> }
            { ! Info && <Text style={ { ...labelPadding, minWidth: labelMinWidth + 12 } }>{ label }</Text> }
            { children }
        </View>

        { Below }
    </View>;
};

export default InfoRowControl;