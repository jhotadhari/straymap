/**
 * External dependencies
 */
import {
	useTheme,
    ActivityIndicator,
} from 'react-native-paper';

const LoadingIndicator = () => {
	const theme = useTheme();
	return <ActivityIndicator
		animating={ true }
		// size={ 'large' }
		style={ {
			backgroundColor: theme.colors.background,
			borderRadius: theme.roundness,
		} }
		color={ theme.colors.primary }
	/>;
};

export default LoadingIndicator;
