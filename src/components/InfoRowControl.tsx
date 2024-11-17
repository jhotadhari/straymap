
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
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoControlWrapper from './InfoControlWrapper';

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
    backgroundBlur = false,
    headerPlural = false,
} : {
    label?: string;
    children: ReactNode;
    Info?: ReactNode | string;
    Below?: ReactNode;
    backgroundBlur?: boolean,
    headerPlural?: boolean,
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [modalVisible, setModalVisible] = useState( false );
    return <InfoControlWrapper
        label={ label }
        Info={ Info }
        Below={ Below }
        backgroundBlur={ backgroundBlur }
        headerPlural={ headerPlural }
        modalVisible={ modalVisible }
        setModalVisible={ setModalVisible }
    >
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
    </InfoControlWrapper>;
};

export default InfoRowControl;