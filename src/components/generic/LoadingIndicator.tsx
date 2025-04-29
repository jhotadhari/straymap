/**
 * External dependencies
 */
import { ViewStyle } from 'react-native';
import {
	useTheme,
    ActivityIndicator,
} from 'react-native-paper';

const LoadingIndicator = ( {
	style,
} : {
	style?: ViewStyle;
} ) => {
	const theme = useTheme();
	return <ActivityIndicator
		animating={ true }
		// size={ 'large' }
		style={ {
			backgroundColor: 'transparent',
			borderRadius: theme.roundness,
			...style,
		} }
		color={ theme.colors.primary }
	/>;
};

export default LoadingIndicator;
