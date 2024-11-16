/**
 * External dependencies
 */
import {
    TextStyle,
	TouchableHighlight,
	useWindowDimensions,
	View,
} from 'react-native';
import {
    Text,
    useTheme,
    RadioButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { OptionBase } from '../types';
import { modalWidthFactor } from '../constants';

const space = 6;

const RadioListItem = ( {
    opt,
    onPress,
    labelExtractor,
    descExtractor,
    labelStyle,
    descStyle,
    status = 'unchecked',
} : {
    opt: OptionBase;
    onPress: () => void;
    labelExtractor?: ( opt: OptionBase ) => string | null;
    descExtractor?: ( opt: OptionBase ) => string | null;
    labelStyle?: TextStyle;
    descStyle?: TextStyle;
    status?: 'unchecked' | 'checked' | undefined;
} ) => {
	const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const theme = useTheme();
    const label = labelExtractor ? labelExtractor( opt ) : null;
    const desc = descExtractor ? descExtractor( opt ) : null;
    return <TouchableHighlight
        key={ opt.key }
        onPress={ onPress }
        underlayColor={ theme.colors.elevation.level3 }
        style={ {
            padding: space,
            marginLeft: -space,
            marginRight: -space,
            borderRadius: theme.roundness,
            width: width * modalWidthFactor - 4 * space,
        } }
    >
        <View
            style={ {
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
            } }
        >
            <View style={ { flexGrow: 1 } }>
                { label && <Text style={ { ...theme.fonts.bodyLarge, ...labelStyle } } >{ t( label ) }</Text> }
                { desc && <Text style={ { ...theme.fonts.bodySmall, ...descStyle } } >{ t( desc ) }</Text> }
            </View>
            <RadioButton
                value={ opt.key }
                onPress={ onPress }
                status={ status }
            />
        </View>
    </TouchableHighlight>;
};

export default RadioListItem;