
/**
 * External dependencies
 */
import React, {
	useContext,
    useState,
} from 'react';
import {
	LayoutRectangle,
	View,
} from 'react-native';
import {
    List,
    Menu,
	useTheme,
} from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { OptionBase } from '../types';
import MenuItem from './MenuItem';
import ListItem from './ListItem';

const menuMarginRight = 0;
const menuMarginTop = 10;

const ListItemMenuControl = ( {
	options,
	value,
	setValue,
	anchorLabel,
	anchorIcon,
} : {
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
	const [visible,setVisible] = useState( false );
	const [layout,setLayout] = useState<null | LayoutRectangle>( null )
    const { topAppBarHeight } = useContext( AppContext )
	return <View onLayout={ e => setLayout( e.nativeEvent.layout ) } >
		<ListItem
			title={ anchorLabel }
			icon={ anchorIcon ? anchorIcon : undefined }
			onPress={ () => setVisible( ! visible ) }
		/>
		{ layout && <Menu
			contentStyle={ {
				borderColor: theme.colors.outline,
				borderWidth: 1,
			} }
			style={ { minWidth: ( layout.x + layout.width - 40 ) / 2 } }
			visible={ visible }
			onDismiss={ () => setVisible( false ) }
			anchor={ {
				x: layout.x + layout.width / 2 - menuMarginRight,
				y: layout.y + menuMarginTop + ( topAppBarHeight ? topAppBarHeight : 0 ) }
			}
		>
			{ options && setValue && [...options].map( opt => <MenuItem
				key={ opt.key }
				onPress={ () => {
					setValue( opt.key );
					setVisible( false );
				} }
				title={ opt.label }
				active={ opt.key === value }
			/> ) }
		</Menu> }
	</View>;
};

export default ListItemMenuControl;