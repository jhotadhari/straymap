/**
 * External dependencies
 */
import {
    ReactNode,
    useState,
} from 'react';
import {
    IconButtonProps,
} from 'react-native-paper';

/**
 * Internal dependencies
 */
import IconButtonHighlight from './IconButtonHighlight';
import InfoControlWrapper from './InfoControlWrapper';

const InfoButton = ( {
    label,
    Info,
    Below,
    backgroundBlur = false,
    headerPlural = false,
    buttonProps,
} : {
    label?: string;
    Info?: ReactNode | string;
    Below?: ReactNode;
    backgroundBlur?: boolean;
    headerPlural?: boolean;
    buttonProps: IconButtonProps;
} ) => {
	const [modalVisible, setModalVisible] = useState( false );
    return buttonProps.icon ? <InfoControlWrapper
        label={ label }
        Info={ Info }
        Below={ Below }
        backgroundBlur={ backgroundBlur }
        headerPlural={ headerPlural }
        modalVisible={ modalVisible }
        setModalVisible={ setModalVisible }
    >
        <IconButtonHighlight
            {...buttonProps}
            onPress={ () => setModalVisible( true ) }
        />
    </InfoControlWrapper> : null;
};

export default InfoButton;