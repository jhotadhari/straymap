
/**
 * External dependencies
 */
import React, { useContext } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Icon, MD3Colors, useTheme } from 'react-native-paper';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { AppContext } from '../Context';

const Center = ( {
	width,
	height,
} : {
	width: number;
	height: number;
} ) => {

	const theme = useTheme();
    const {
		isBusy,
    } = useContext( AppContext )

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
		{ isBusy && <ActivityIndicator
			animating={ true }
			size={ 'large' }
			style={ {
				backgroundColor: theme.colors.background,
				borderRadius: theme.roundness * 2,
				padding: 15

			 } }
			color={ theme.colors.primary }
		/> }

		{ ! isBusy && <Icon
			source="target"
			color={ MD3Colors.error50 }
			size={ 25 }
		/> }

	</View>;
};

export default Center;
