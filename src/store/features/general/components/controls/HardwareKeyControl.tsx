/**
 * External dependencies
 */
import React, {
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
import { OptionBase } from '../../../../../types';
import ListItemModalControl from '../../../../../components/generic/ListItemModalControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../components/generic/MenuItem';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectHardwareKeys } from '../../selectors';
import { setHardwareKeys } from '../../generalSlice';

const keyCodeStringOptions : OptionBase[] = [
	{
		key: 'KEYCODE_VOLUME_UP',
		label: 'volumeUp',
	},
	{
		key: 'KEYCODE_VOLUME_DOWN',
		label: 'volumeDown',
	},
];
const actionKeyOptions : OptionBase[] = [
	{
		key: 'none',
		label: 'nothing',
	},
	{
		key: 'zoomIn',
		label: 'zoomIn',
	},
	{
		key: 'zoomOut',
		label: 'zoomOut',
	},
];

const RowItem = ( {
	keyCodeStringOption,
} : {
	keyCodeStringOption: OptionBase;
} ) => {


	const { t } = useTranslation();
	const theme = useTheme();

	const hardwareKeyActionConfigs = useAppSelector( selectHardwareKeys );

	const dispatch = useAppDispatch();

	const [visible,setVisible] = useState( false );

	const hardwareKeyActionConfig = hardwareKeyActionConfigs.find( conf => conf.keyCodeString === keyCodeStringOption.key );
	const selectedActionKeyOption = actionKeyOptions.find( actionKeyOption => actionKeyOption.key === hardwareKeyActionConfig?.actionKey );

	return <View style={ {
		flexDirection: 'row',
		marginTop: 10,
		marginBottom: 10,
		alignItems: 'center'
	} }>

		<Text
			style={ {
				minWidth: '40%',
			} }
		>{ t( keyCodeStringOption.label ) }</Text>

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
			{ actionKeyOptions.map( actionKeyOption => <MenuItem
				key={ actionKeyOption.key }
				onPress={ () => {
					const newHardwareKeyActionConfigs = [...hardwareKeyActionConfigs];
					const index = newHardwareKeyActionConfigs.findIndex( conf => conf.keyCodeString === keyCodeStringOption.key );
					newHardwareKeyActionConfigs.splice( index, 1, {
						actionKey: actionKeyOption.key,
						keyCodeString: keyCodeStringOption.key,
					} );
					dispatch( setHardwareKeys( newHardwareKeyActionConfigs ) );
					setVisible( false );
				} }
				title={ t( actionKeyOption.label ) }
				active={ actionKeyOption.key === hardwareKeyActionConfig?.actionKey }
			/> ) }
		</Menu>
	</View>
};

const HardwareKeyControl = () => {

	const { t } = useTranslation();

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
		{ keyCodeStringOptions.map( ( keyCodeStringOption: OptionBase ) => <RowItem
			key={ keyCodeStringOption.key }
			keyCodeStringOption={ keyCodeStringOption }
		/> ) }
	</ListItemModalControl>;
};

export default HardwareKeyControl;