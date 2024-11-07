
/**
 * External dependencies
 */
import {
	Text,
	View,
} from 'react-native';

const Center = ( {
	width,
	height,
} : {
	width: number;
	height: number;
} ) => {

	const size = 30;

	return <View
			style={ {
				position: 'absolute',
				top: 0,
				left: 0,
				justifyContent: 'center',
				alignItems: 'center',
				width,
				height,
			} }
		>
			<Text style={ {
				color: 'red',
				fontSize: 20,
				fontWeight: 'bold',
			} }>X</Text>
	</View>;
};

export default Center;
