/**
 * External dependencies
 */
import {
    TextStyle,
} from 'react-native';
import {
    RadioButton,
} from 'react-native-paper';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../types';
import InfoRowControl from './InfoRowControl';
import { ReactNode } from 'react';

const InfoRadioRow = ( {
    opt,
    onPress,
    Info,
    labelExtractor,
    labelStyle = {},
    status = 'unchecked',
    radioAlign = 'right',
} : {
    opt: OptionBase;
    onPress: () => void;
    Info?: ReactNode | string;
    labelExtractor?: ( opt: OptionBase ) => string | null;
    labelStyle?: TextStyle;
    status?: 'unchecked' | 'checked';
    radioAlign?: 'left' | 'right';
} ) => {
    const label = labelExtractor ? labelExtractor( opt ) : null;
    return <InfoRowControl
        label={ label || undefined }
        Info={ Info }
        labelStyle={ {
            ...labelStyle,
            ...( 'right' === radioAlign && { flexGrow: 1 } ),
        } }
    >
        <RadioButton
            value={ opt.key }
            onPress={ onPress }
            status={ status }
        />
    </InfoRowControl>;
};

export default InfoRadioRow;