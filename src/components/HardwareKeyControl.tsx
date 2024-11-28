/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
	View,
} from 'react-native';
import {
	Icon,
	Menu,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { GeneralSettings, HardwareKeyActionConf, OptionBase } from '../types';
import ListItemModalControl from './ListItemModalControl';
import ButtonHighlight from './ButtonHighlight';
import MenuItem from './MenuItem';

const keyCodeStringOptions : OptionBase[] = [
	{
		key: 'KEYCODE_VOLUME_UP',
		label: 'Volume Up',	// ??? translate
	},
	{
		key: 'KEYCODE_VOLUME_DOWN',
		label: 'Volume Down',// ??? translate
	},
];
const actionKeyOptions : OptionBase[] = [
	{
		key: 'none',
		label: 'nothing',// ??? translate
	},
	{
		key: 'zoomIn',
		label: 'Zoom in',// ??? translate
	},
	{
		key: 'zoomOut',
		label: 'Zoom out',// ??? translate
	},
];

const MappingRowControl = ( {
	hardwareKeyActionConfigs,
	setHardwareKeyActionConfigs,
} : {
	hardwareKeyActionConfigs: HardwareKeyActionConf[];
	setHardwareKeyActionConfigs?: Dispatch<SetStateAction<HardwareKeyActionConf[]>>;
} ) => {
	const { t } = useTranslation();
	const theme = useTheme();

	return  <View>
		{ [...keyCodeStringOptions].map( ( keyCodeStringOption: OptionBase ) => {

			const [visible,setVisible] = useState( false );

			const hardwareKeyActionConfig = hardwareKeyActionConfigs.find( conf => conf.keyCodeString === keyCodeStringOption.key );
			const selectedActionKeyOption = actionKeyOptions.find( actionKeyOption => actionKeyOption.key === hardwareKeyActionConfig?.actionKey );

			return <View key={ keyCodeStringOption.key } style={ {
				flexDirection: 'row',
				marginTop: 10,
				marginBottom: 10,
				alignItems: 'center'
			} }>

				<Text
					style={ {
						minWidth: '40%',
					} }
				>{ keyCodeStringOption.label }</Text>

				<Menu
					contentStyle={ {
						borderColor: theme.colors.outline,
						borderWidth: 1,
					} }
					style={ {
						marginLeft: 100
					} }
					visible={ visible }
					onDismiss={ () => setVisible( false ) }
					anchor={ <ButtonHighlight
						mode="outlined"
						// style={ {
						// 	minWidth: '40%',
						// } }
						onPress={ () => setVisible( ! visible ) }
						buttonColor={ theme.colors.background }
						textColor={ theme.colors.onBackground }
					>
						<Text>{ t( get( selectedActionKeyOption, 'label', '' ) ) }</Text>
					</ButtonHighlight> }
				>
					{ [...actionKeyOptions].map( actionKeyOption => <MenuItem
							key={ actionKeyOption.key }
							onPress={ () => {
								const newHardwareKeyActionConfigs = [...hardwareKeyActionConfigs];
								const index = newHardwareKeyActionConfigs.findIndex( conf => conf.keyCodeString === keyCodeStringOption.key );
								newHardwareKeyActionConfigs.splice( index, 1, {
									actionKey: actionKeyOption.key,
									keyCodeString: keyCodeStringOption.key,
								} );
								setHardwareKeyActionConfigs && setHardwareKeyActionConfigs( newHardwareKeyActionConfigs );
								setVisible( false );
							} }
							title={ t( actionKeyOption.label ) }
							active={ actionKeyOption.key === hardwareKeyActionConfig?.actionKey }
						/> ) }
				</Menu>
			</View>
		} ) }
	</View>;
};

const HardwareKeyControl = () => {

	const { t } = useTranslation();

	const {
		generalSettings,
		setGeneralSettings,
	} = useContext( AppContext );

	const [hardwareKeyActionConfigs,setHardwareKeyActionConfigs] = useState<HardwareKeyActionConf[] >( get( generalSettings, 'hardwareKeys', [] ) );
	const hardwareKeyActionConfigRef = useRef( hardwareKeyActionConfigs );
    useEffect( () => {
        hardwareKeyActionConfigRef.current = hardwareKeyActionConfigs;
    }, [hardwareKeyActionConfigs] );

    const save = () => generalSettings && setGeneralSettings && setGeneralSettings( ( generalSettings: GeneralSettings ) => ( {
        ...generalSettings,
        ...( hardwareKeyActionConfigRef.current && { hardwareKeys: hardwareKeyActionConfigRef.current } ),
    } ) );
    useEffect( () => save, [] );    // Save on unmount.

	return <ListItemModalControl
		anchorLabel={ t( 'hardwareKeyAssignment' ) }
		anchorIcon={ ( { color, style } ) => <View style={ style }>

			<Icon
				source="cellphone-settings"
				color={ color }
				size={ 25 }
			/>
		</View> }
		header={ t( 'hardwareKey', { count: 0 } ) }
		hasHeaderBackPress={ true }
	>

		<MappingRowControl
			hardwareKeyActionConfigs={ hardwareKeyActionConfigs }
			setHardwareKeyActionConfigs={ setHardwareKeyActionConfigs }
		/>

	</ListItemModalControl>;
};

export default HardwareKeyControl;