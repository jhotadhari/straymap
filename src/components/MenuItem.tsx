
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
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { View, TouchableHighlight, ViewStyle } from 'react-native';

const MenuItem = ( {
	onPress,
	leadingIcon,
	iconSize,
	title,
	style,
	active,
} : {
	onPress?: () => void;
	leadingIcon?: IconSource;
	iconSize?: number;
	style?: null | ViewStyle;
	title?: ReactNode;
	active?: boolean;
} ) => {
	const theme = useTheme();
	return <TouchableHighlight
		underlayColor={ theme.colors.elevation.level3 }
		onPress={ onPress }
	>
		<View style={ {
			padding: 10,
			flexDirection: 'row',
			alignItems: 'center',
			...( active && { backgroundColor: theme.colors.primary } ),
			...style,
		} }>
			{ leadingIcon && <View style={ { marginRight: 10 } } ><Icon
				source={ leadingIcon }
				size={ iconSize || 25 }
				color={ active ? theme.colors.onPrimary : undefined }
			/></View> }
			{ title && 'string' === typeof title && <Text style={ active ? { color: theme.colors.onPrimary } : {} } >{ title }</Text> }
			{ title && 'string' !== typeof title && title }
		</View>
	</TouchableHighlight>;
};

export default MenuItem;