
/**
 * External dependencies
 */
import {
	Dispatch,
	SetStateAction,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	useTheme,
	Appbar,
	Menu,
	Icon,
} from 'react-native-paper';
import { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { useTranslation } from 'react-i18next';
import { View, BackHandler, TouchableHighlight, ActivityIndicator } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

/**
 * Internal dependencies
 */
import type { HierarchyItem, MenuItem as MenuItemType } from '../types';
import Settings from './Settings';
import About from './About';
import { AppContext } from '../Context';
import MenuItem from './generic/MenuItem';

const EgalTest = () => {
	const theme = useTheme();
	const { width } = useSafeAreaFrame();
    const {
        appInnerHeight,
    } = useContext( AppContext )
	return <View style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
    </View>;
};

const menuItems : MenuItemType[] = [
	// {
	// 	key: 'tools',
	// 	label: 'menu.tools',
	// 	leadingIcon: 'tools',
	// 	children: [
	// 		{
    //             key: 'routing',
	// 			label: 'menu.routing',
	// 			hierarchyIncludeParents: false,
	// 			leadingIcon: 'routes',
	// 		},
	// 	]
	// },
	// {
    //     key: 'egal',
	// 	label: 'menu.egal',
	// 	leadingIcon: 'progress-question',
	// 	children: [
	// 		{
    //             key: 'egalSub1',
	// 			label: 'menu.egalSub1',
	// 			leadingIcon: 'progress-question',
    //             SubActivity: <EgalTest/>,
	// 		},
	// 		{
    //             key: 'egalSub2',
	// 			label: 'menu.egalSub2',
	// 			leadingIcon: 'progress-question',
    //             SubActivity: <EgalTest/>,
	// 		},
	// 	]
	// },
	{
        key: 'settings',
		label: 'menu.settings',
		leadingIcon: 'cog',
		SubActivity: <Settings/>,
	},
	{
        key: 'about',
		label: 'menu.about',
		leadingIcon: 'information-variant',
		SubActivity: <About/>,
	},
];

const TopAppBarMenu = ( {
	items,
	anchorIcon,
	anchorTitle,
	anchorActive,
	parents,
    closeParentMenus,
    selectedHierarchyItems,
    setSelectedHierarchyItems,
} : {
	items: MenuItemType[];
	anchorIcon: IconSource;
	anchorTitle?: string;
	anchorActive?: boolean;
	parents?: HierarchyItem[];
    closeParentMenus?: () => void;
	selectedHierarchyItems?: null | HierarchyItem[];
	setSelectedHierarchyItems: Dispatch<SetStateAction<null | HierarchyItem[]>>;
} ) => {

	const { t } = useTranslation();

	const theme = useTheme();

	const [menuVisible, setMenuVisible] = useState( false );

    const closeMenu = closeParentMenus
        ? () => { closeParentMenus ? closeParentMenus() : null; setMenuVisible( false ) }
        : () => setMenuVisible( false );

	const anchor = ! parents || ! parents.length
		? <TouchableHighlight
			style={ {
				padding: 10,
				marginBottom: 5,
				marginRight: 5,
				borderRadius: theme.roundness,
			} }
			underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => setMenuVisible( ! menuVisible ) }
        >
			<Icon
				source={ anchorIcon }
				size={ 30 }
			/>
		</TouchableHighlight>
		: <MenuItem
            leadingIcon={ anchorIcon }
            title={ anchorTitle }
            onPress={ () => setMenuVisible( ! menuVisible ) }
            active={ anchorActive }
        />

	return 	<Menu
		contentStyle={ {
			borderColor: theme.colors.outline,
			borderWidth: 1,
		} }
		style={ { minWidth: 175} }
		visible={ menuVisible }
		onDismiss={ () => closeMenu() }
		anchor={ anchor }
	>
		{ [...items].map( ( item, index ) => {
            const isActive = !! ( selectedHierarchyItems ? selectedHierarchyItems.find( s => s.key === item.key ) : false );

			if ( item.children ) {
				return <TopAppBarMenu
					key={ index }
					selectedHierarchyItems={ selectedHierarchyItems }
					setSelectedHierarchyItems={ setSelectedHierarchyItems }
					closeParentMenus={ closeMenu }
					parents={ [
                        ...( parents ? parents : [] ),
                        item,
                    ] }
					items={ item.children }
					anchorIcon={ item.leadingIcon }
					anchorActive={ isActive }
					anchorTitle={ t( item.label ) }
				/>;
			} else {
				return <MenuItem
					key={ index }
					onPress={ () => {
						setSelectedHierarchyItems( [
							...( parents && false !== item.hierarchyIncludeParents ? parents : [] ),
							item,
						] )
						closeMenu();
					} }
					leadingIcon={ item.leadingIcon }
					title={ t( item.label ) }
					active={ isActive }
				/>
			}
		} ) }
	</Menu>;
};

const LoadingIndicator = () => {
	const theme = useTheme();
	return <ActivityIndicator
		animating={ true }
		size={ 'large' }
		style={ {
			backgroundColor: theme.colors.background,
			borderRadius: theme.roundness,
		} }
		color={ theme.colors.primary }
	/>;
};

const TopAppBar = ( {
	setTopAppBarHeight,
} : {
	setTopAppBarHeight: Dispatch<SetStateAction<number>>;
} ) => {

	const { t } = useTranslation();

	const theme = useTheme();

    const {
		selectedHierarchyItems,
		setSelectedHierarchyItems,
		isBusy,
    } = useContext( AppContext )

	const backAction = () => {
		if ( setSelectedHierarchyItems && selectedHierarchyItems ) {
			let newSelectedHierarchyItems = [...selectedHierarchyItems];
			newSelectedHierarchyItems.pop();
			const maybeTraverseUp = ( newSelectedHierarchyItems : HierarchyItem[] ) : HierarchyItem[] => {
				if ( newSelectedHierarchyItems.length && newSelectedHierarchyItems[newSelectedHierarchyItems.length-1].children ) {
					newSelectedHierarchyItems.pop();
					return maybeTraverseUp( newSelectedHierarchyItems );
				}
				return newSelectedHierarchyItems;
			};
			newSelectedHierarchyItems = maybeTraverseUp( newSelectedHierarchyItems );
			setSelectedHierarchyItems( newSelectedHierarchyItems.length ? newSelectedHierarchyItems : null );
		}
		return true;
	};

	useEffect(() => {
		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction,
		);
		return () => backHandler.remove();
	}, [selectedHierarchyItems] );

	return <Appbar
        onLayout={ e => {
            const { height } = e.nativeEvent.layout;
            setTopAppBarHeight( height );
        } }
		style={ {
			justifyContent: 'space-between',
		} }
	>
		{ selectedHierarchyItems && <TouchableHighlight
			style={ {
				padding: 10,
				marginLeft: 5,
				marginRight: 10,
				borderRadius: theme.roundness,
			} }
			underlayColor={ theme.colors.elevation.level3 }
            onPress={ backAction }
        >
			<View>
				{ ! isBusy && <Icon
					source="arrow-left"
					size={ 30 }
				/> }
				{ isBusy && <LoadingIndicator/> }
			</View>
		</TouchableHighlight> }

        <Appbar.Content title={ selectedHierarchyItems
            ? [...selectedHierarchyItems].map( item => t( item.label ) ).join( ' / ' )
            : ''    // Empty element, but moves the menu right
        } />

		{ setSelectedHierarchyItems && <TopAppBarMenu
			selectedHierarchyItems={ selectedHierarchyItems }
			setSelectedHierarchyItems={ setSelectedHierarchyItems }
			items={ menuItems }
			anchorIcon={ props => isBusy
				? <LoadingIndicator/>
				: <Icon size={ 30 } source="menu"/>
			}
		/> }
	</Appbar>;
};

export default TopAppBar;