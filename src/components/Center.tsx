
/**
 * External dependencies
 */
import React, { useContext, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { ActivityIndicator, Icon, useTheme } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { readFile } from 'react-native-fs';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { AppContext } from '../Context';
import { CurserConfig } from '../types';

export const CenterInner = ( {
	curser,
} : {
	curser?: CurserConfig;
} ) => {

	const { appearanceSettings } = useContext( AppContext );

	const curserConfig = curser || appearanceSettings?.curser;

	const [xml,setXml] = useState( '' );

	// ??? should handle png

	useEffect( () => {
		if ( curserConfig && ( curserConfig.iconSource.startsWith( 'content://' ) || curserConfig.iconSource.startsWith( '/' ) ) && curserConfig.iconSource.endsWith( '.svg' ) ) {
			readFile( curserConfig.iconSource, 'utf8' ).then( ( newXml: string ) => {
				setXml( newXml );
			} ).catch( ( err: any ) => { console.log( 'ERROR readFile', err ) } );
		} else {
			setXml( '' );
		}
	}, [curserConfig?.iconSource] );

	return <View>

		{ curserConfig && ! curserConfig.iconSource.startsWith( 'content://' ) && ! curserConfig.iconSource.startsWith( '/' ) && <Icon
			source={ curserConfig.iconSource }
			color={ curserConfig.color }
			size={ curserConfig.size }
		/> }

		{ curserConfig && curserConfig.iconSource.toLowerCase().endsWith( '.svg' ) && xml && <View style={ {
			width: curserConfig.size,
			height: curserConfig.size,
		} }>
			<SvgXml xml={ xml } width="100%" height="100%" />
		</View> }

		{ curserConfig && curserConfig.iconSource.toLowerCase().endsWith( '.png' ) && <View style={ {
			width: curserConfig.size,
			height: curserConfig.size,
		} }>
			<Image
				source={ { uri: curserConfig.iconSource.startsWith( '/' )
					? 'file://' + curserConfig.iconSource
					: curserConfig.iconSource } }
				style={{
					width: curserConfig.size,
					height: curserConfig.size
				}
			} />
		</View> }

	</View>
};

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

		{ ! isBusy && <CenterInner/> }

	</View>;
};

export default Center;
