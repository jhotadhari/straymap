/**
 * External dependencies
 */
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Icon, useTheme } from 'react-native-paper';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
} from 'react-native-reanimated';
import {
	ComposedGesture,
	Gesture,
	GestureDetector,
	GestureType,
} from 'react-native-gesture-handler';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerElementComponents from "./elements";

function clamp( val: number, min: number, max: number ) : number {
	return Math.min( Math.max( val, min), max );
};

const handleSize = 50;

const DrawerInner = ( {
	activeElement,
	drawerWidth,
	drawerHeight,
} : {
	activeElement: any;
	drawerWidth: number;
	drawerHeight: number;
} ) => {
	if ( ! activeElement ) {
		return null;
	}

	const DisplayComponent = get( drawerElementComponents, [activeElement.type as string,'DisplayComponent'] );
	if ( ! DisplayComponent ) {
		return null;
	}

	return <View style={ {
		padding: 20,
	} }>
		<DisplayComponent
			drawerWidth={ drawerWidth }
			drawerHeight={ drawerHeight }
		/>
	</View>;
};

const DrawerHandle = ( {
	index,
	element,
	activeElementKey,
	setActiveElementKey,
	gesture,
	drawerWidth,
	translationX,
	setTranslationX,
} : {
	index: number;
	element: any;
	activeElementKey?: string;
	setActiveElementKey: Dispatch<SetStateAction<string | undefined>>;
	gesture: ComposedGesture | GestureType;
	drawerWidth: number;
	translationX: number;
	setTranslationX: ( newVal: number ) => void;
} ) => {
	const theme = useTheme();
	const IconComponent = get( drawerElementComponents, [element.type as string,'IconComponent'] );
	const iconSource = IconComponent ? undefined : get( drawerElementComponents, [element.type as string,'iconSource'] );
	const color = element.type === activeElementKey ? theme.colors.onBackground : theme.colors.background;
	return <GestureDetector key={ index } gesture={ gesture }>
		<View
			style={ {
				position: 'absolute',
				width: handleSize,
				height: handleSize,
				justifyContent: 'center',
				alignItems: 'center',
				right: 0,
				top: index * handleSize + ( ( index + 1 ) * ( handleSize / 2 ) ),
				transform: [
					{ translateX: '100%' },
				],
				backgroundColor: element.type === activeElementKey
					? theme.colors.background
					: 'transparent',
				borderTopRightRadius: '50%',
				borderBottomRightRadius: '50%',
				borderColor: theme.colors.background,
				borderWidth: 1,
				borderLeftWidth: 0,

			} }
		>
			<Button
				style={ {
					borderTopLeftRadius: 0,
					borderBottomLeftRadius: 0,
				} }
				onPress={ () => {
					if ( activeElementKey === element.type ) {
						setTranslationX( translationX === -drawerWidth
							? 0
							: - drawerWidth
						)
					} else {
						setActiveElementKey( element.type );
						if ( translationX === -drawerWidth ) {
							setTranslationX( 0 );
						}
					}
				} }
				compact={ true }
			>
				{ IconComponent && <IconComponent color={ color }/> }
				{ iconSource && <Icon
					source={ iconSource }
					size={ 25 }
					color={ color }
				/> }
			</Button>
		</View>
	</GestureDetector>;;
};

const Drawer = ( {
	elements,
	drawerWidth,
	outerWidth,
	height,
} : {
	elements: any;
	drawerWidth: number;
	outerWidth: number;
	height: number;
} ) => {

	drawerWidth = drawerWidth <= outerWidth * 2/3
		? drawerWidth
		: outerWidth * 2/3;

	const theme = useTheme();
	const [activeElementKey,setActiveElementKey] = useState<string | undefined>( elements.length ? elements[0]['type'] : undefined );
	const activeElement = elements.find( ( el: any ) => el.type === activeElementKey );
	const translationX = useSharedValue( - drawerWidth );
	const prevTranslationX = useSharedValue( - drawerWidth );

	const [showInner,setShowInner] = useState( false );

	const animatedStyles = useAnimatedStyle( () => ( {
	  transform: [{ translateX: translationX.value }],
	} ) );

	const setTranslationX = ( newVal: number ) => {
		translationX.value = newVal;
		setShowInner( true );
	};

	const pan = Gesture.Pan()
		.minDistance( 1 )
		.onStart( () => {
			prevTranslationX.value = translationX.value;
		} )
		.onUpdate( ( event ) => {
			setTranslationX( clamp(
				prevTranslationX.value + event.translationX,
				- drawerWidth,
				0
			) );
		} )
		.runOnJS( true );

	return <View style={ {
		position: 'absolute',
		top: 0,
		left: 0,
		alignItems: 'flex-start',
		width: outerWidth,
		height,
	} } >
		<Animated.View style={ [animatedStyles, {
			width: drawerWidth,
			height,
			backgroundColor: theme.colors.background,
		}] }>

			{ elements && [...elements].map( ( element, index ) => <DrawerHandle
				key={ index }
				index={ index }
				element={ element }
				activeElementKey={ activeElementKey }
				setActiveElementKey={ setActiveElementKey }
				gesture={ pan }
				drawerWidth={ drawerWidth }
				translationX={ translationX.value }
				setTranslationX={ setTranslationX }
			/> ) }

			{ activeElement && showInner && <DrawerInner
				activeElement={ activeElement }
				drawerWidth={ drawerWidth }
				drawerHeight={ height }
			/> }

		</Animated.View>
	</View>;
};


export default Drawer;
