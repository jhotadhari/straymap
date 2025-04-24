/**
 * External dependencies
 */
import React, { Dispatch, SetStateAction, useState } from 'react';
import { View } from 'react-native';
import { Button, Icon, useTheme } from 'react-native-paper';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	SharedValue,
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

export type DrawerState = {
	showInner: boolean;
	gesture: ComposedGesture | GestureType;
	animatedStyles: any;
	side: string;
	drawerWidth: number;
	outerWidth: number;
	expand: ( expanded: boolean ) => void;
	getIsFullyCollapsed: () => boolean;
};

const handleSize = 50;

const DrawerInner = ( {
	activeElement,
	drawerWidth,
	drawerHeight,
	side,
} : {
	activeElement: any;
	drawerWidth: number;
	drawerHeight: number;
	side: string;
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
		marginTop: handleSize / 2,
	} }>
		<DisplayComponent
			drawerWidth={ drawerWidth }
			drawerHeight={ drawerHeight }
			drawerSide={ side }
		/>
	</View>;
};

const DrawerHandle = ( {
	index,
	side,
	element,
	activeElementKey,
	setActiveElementKey,
	gesture,
	getIsFullyCollapsed,
	expand,
} : {
	index: number;
	side: string;
	element: any;
	activeElementKey?: string;
	setActiveElementKey: Dispatch<SetStateAction<string | undefined>>;
	gesture: ComposedGesture | GestureType;
	getIsFullyCollapsed: () => boolean;
	expand: ( expanded: boolean ) => void;
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
				top: index * handleSize + ( ( index + 1 ) * ( handleSize / 2 ) ),
				backgroundColor: element.type === activeElementKey
					? theme.colors.background
					: 'transparent',
				borderColor: theme.colors.background,
				borderWidth: 1,
				...( 'left' === side && {
					right: 0,
					transform: [
						{ translateX: '100%' },
					],
					borderTopRightRadius: '50%',
					borderBottomRightRadius: '50%',
					borderLeftWidth: 0,
				} ),
				...( 'right' === side && {
					left: 0,
					transform: [
						{ translateX: '-100%' },
					],
					borderTopLeftRadius: '50%',
					borderBottomLeftRadius: '50%',
					borderRightWidth: 0,
				} ),
			} }
		>
			<Button
				style={ {
					borderTopLeftRadius: 0,
					borderBottomLeftRadius: 0,
				} }
				onPress={ () => {
					if ( activeElementKey === element.type ) {
						expand( getIsFullyCollapsed() );
					} else {
						setActiveElementKey( element.type );
						if ( getIsFullyCollapsed() ) {
							expand( true );
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
	height,
	drawerState: {
		side,
		drawerWidth,
		outerWidth,
		showInner,
		gesture,
		animatedStyles,
		expand,
		getIsFullyCollapsed,
	},
} : {
	elements: any;
	height: number;
	drawerState: DrawerState;
} ) => {

	const theme = useTheme();
	const [activeElementKey,setActiveElementKey] = useState<string | undefined>( elements.length ? elements[0]['type'] : undefined );
	const activeElement = elements.find( ( el: any ) => el.type === activeElementKey );

	return <View style={ {
		position: 'absolute',
		top: 0,
		left: 0,
		alignItems: 'left' === side ? 'flex-start' : 'flex-end',
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
				side={ side }
				index={ index }
				element={ element }
				activeElementKey={ activeElementKey }
				setActiveElementKey={ setActiveElementKey }
				gesture={ gesture }
				getIsFullyCollapsed={ getIsFullyCollapsed }
				expand={ expand }
			/> ) }

			{ activeElement && showInner && <DrawerInner
				activeElement={ activeElement }
				side={ side }
				drawerWidth={ drawerWidth }
				drawerHeight={ height }
			/> }

		</Animated.View>
	</View>;
};


export default Drawer;
