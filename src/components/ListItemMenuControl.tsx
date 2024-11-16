
/**
 * External dependencies
 */
import React, {
    useState,
} from 'react';
import {
    Menu,
	useTheme,
} from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { OptionBase } from '../types';
import MenuItem from './MenuItem';
import ListItem from './ListItem';
import { ViewStyle } from 'react-native';

const ListItemMenuControl = ( {
	listItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorIcon,
} : {
	listItemStyle?: ViewStyle;
	anchorLabel: string;
	options?: OptionBase[];
	value?: string;
	setValue?: ( ( newValue: string ) => void )
	anchorIcon?: ( ( props: {
		color: string;
		style: ListStyle;
	}) => React.ReactNode );
} ) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [visible,setVisible] = useState( false );
	return <Menu
		contentStyle={ {
			borderColor: theme.colors.outline,
			borderWidth: 1,
		} }
		style={ {
			marginLeft: 100
		} }
		visible={ visible }
		onDismiss={ () => setVisible( false ) }
		anchor={ <ListItem
			style={ listItemStyle }
			title={ anchorLabel }
			icon={ anchorIcon ? anchorIcon : undefined }
			onPress={ () => setVisible( ! visible ) }
		/> }
	>
		{ options && setValue && [...options].map( opt => <MenuItem
			key={ opt.key }
			onPress={ () => {
				setValue( opt.key );
				setVisible( false );
			} }
			title={ t( opt.label ) }
			active={ opt.key === value }
		/> ) }
	</Menu>;
};

export default ListItemMenuControl;