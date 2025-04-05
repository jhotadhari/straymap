
/**
 * External dependencies
 */
import {
	ReactNode,
} from 'react';
import {
	useTheme,
	Icon,
	Text,
} from 'react-native-paper';
import { View, TouchableHighlight, ViewStyle } from 'react-native';
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";

const ListItem = ( {
	onPress,
	icon,
	iconSize,
	title,
	style,
	active,
} : {
	onPress?: () => void;
	icon?: ( ( props: {
		color: string;
		style: ListStyle;
	} ) => ReactNode );
	iconSize?: number;
	style?: null | ViewStyle;
	title?: ReactNode;
	active?: boolean;
} ) => {
	const theme = useTheme();
	return <TouchableHighlight
		underlayColor={ theme.colors.elevation.level3 }
		onPress={ onPress }
        style={ { borderRadius: theme.roundness } }
	>
		<View style={ {
			padding: 15,
			marginLeft: 8,
			flexDirection: 'row',
			alignItems: 'center',
			...( active && { backgroundColor: theme.colors.primary } ),
			...style,
		} }>
			{ icon && <View style={ { marginRight: 10 } } ><Icon
				source={ icon }
				size={ iconSize || 25 }
				color={ active ? theme.colors.onPrimary : undefined }
			/></View> }
			{ title && 'string' === typeof title && <Text style={ active ? { color: theme.colors.onPrimary } : {} } >{ title }</Text> }
			{ title && 'string' !== typeof title && title }
		</View>
	</TouchableHighlight>;
};

export default ListItem;