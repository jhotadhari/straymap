/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { readFile } from 'react-native-fs';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../store/hooks';
import { selectCursor } from '../store/features/appearance/selectors';
import { CursorConfig } from '../store/features/appearance/types';

export const CenterInner = ( {
	cursor,
} : {
	cursor?: CursorConfig;
} ) => {

	const cursorConfigFromStore = useAppSelector( selectCursor );

	const cursorConfig = cursor || cursorConfigFromStore;

	const [xml,setXml] = useState( '' );

	useEffect( () => {
		if ( cursorConfig && ( cursorConfig.iconSource.startsWith( 'content://' ) || cursorConfig.iconSource.startsWith( '/' ) ) && cursorConfig.iconSource.endsWith( '.svg' ) ) {
			readFile( cursorConfig.iconSource, 'utf8' ).then( ( newXml: string ) => {
				setXml( newXml );
			} ).catch( ( err: any ) => { console.log( 'ERROR readFile', err ) } );
		} else {
			setXml( '' );
		}
	}, [cursorConfig?.iconSource] );

	return <View>

		{ cursorConfig && ! cursorConfig.iconSource.startsWith( 'content://' ) && ! cursorConfig.iconSource.startsWith( '/' ) && <Icon
			source={ cursorConfig.iconSource }
			color={ cursorConfig.color }
			size={ cursorConfig.size }
		/> }

		{ cursorConfig && cursorConfig.iconSource.toLowerCase().endsWith( '.svg' ) && xml && <View style={ {
			width: cursorConfig.size,
			height: cursorConfig.size,
		} }>
			<SvgXml xml={ xml } width="100%" height="100%" />
		</View> }

		{ cursorConfig && cursorConfig.iconSource.toLowerCase().endsWith( '.png' ) && <View style={ {
			width: cursorConfig.size,
			height: cursorConfig.size,
		} }>
			<Image
				source={ { uri: cursorConfig.iconSource.startsWith( '/' )
					? 'file://' + cursorConfig.iconSource
					: cursorConfig.iconSource } }
				style={{
					width: cursorConfig.size,
					height: cursorConfig.size
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
} ) => <View style={ {
	position: 'absolute',
	top: 0,
	left: 0,
	justifyContent: 'center',
	alignItems: 'center',
	width,
	height,
} } >
	<CenterInner/>
</View>;

export default Center;
