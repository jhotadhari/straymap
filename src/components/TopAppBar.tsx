
/**
 * External dependencies
 */
import React, {
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
import { useWindowDimensions, View, BackHandler } from 'react-native';

/**
 * Internal dependencies
 */
import { HierarchyItem, SettingsItem, type MenuItem } from '../types';
import Settings from './Settings';
import About from './About';
import { AppContext } from '../Context';

const EgalTest = () => {
	const theme = useTheme();
	const { width } = useWindowDimensions();
    const {
        mapHeight,
    } = useContext( AppContext )
	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
    </View>;
};

const menuItems : MenuItem[] = [
	{
		key: 'tools',
		label: 'menu.tools',
		leadingIcon: 'tools',
		children: [
			{
                key: 'routing',
				label: 'menu.routing',
				hierarchyIncludeParents: false,
				leadingIcon: 'routes',
			},
		]
	},
	{
        key: 'egal',
		label: 'menu.egal',
		leadingIcon: 'progress-question',
		children: [
			{
                key: 'egalSub1',
				label: 'menu.egalSub1',
				leadingIcon: 'progress-question',
                SubActivity: <EgalTest/>,
			},
			{
                key: 'egalSub2',
				label: 'menu.egalSub2',
				leadingIcon: 'progress-question',
                SubActivity: <EgalTest/>,
			},
		]
	},
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
	items: MenuItem[];
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
		? <Appbar.Action
            icon={ anchorIcon }
            onPress={ () =>
            setMenuVisible( ! menuVisible ) }
        />
		: <Menu.Item
            leadingIcon={ anchorIcon }
            title={ anchorTitle }
            onPress={ () => setMenuVisible( ! menuVisible ) }
            style={ anchorActive && { backgroundColor: theme.colors.primary } }
            titleStyle={ anchorActive && { color: theme.colors.onPrimary } }
        />

	return 	<Menu
		contentStyle={ {
			borderColor: theme.colors.outline,
			borderWidth: 1,
		} }
		visible={ menuVisible }
		onDismiss={ () => closeMenu() }
		anchor={ anchor }
	>
		{ [...items].map( ( item, index ) => {
            const isActive = !! ( selectedHierarchyItems ? selectedHierarchyItems.find( s => s.key === item.key ) : false );

            const icon : IconSource | undefined = 'string' === typeof item.leadingIcon
                ? ( { color, size } ) => <Icon
                    source={ item.leadingIcon }
                    color={ isActive ? theme.colors.onPrimary : color }
                    size={ size }
                />
                : item.leadingIcon; // ??? should handle custom icons

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
					anchorIcon={ icon }
					anchorActive={ isActive }
					anchorTitle={ t( item.label ) }
				/>;
			} else {

				return <Menu.Item
					key={ index }
					onPress={ () => {
                        setSelectedHierarchyItems( [
                            ...( parents && false !== item.hierarchyIncludeParents ? parents : [] ),
                            item,
                        ] )
                        closeMenu();
                    } }
					leadingIcon={ icon }
					title={ t( item.label ) }
                    style={ isActive && { backgroundColor: theme.colors.primary } }
                    titleStyle={ isActive && { color: theme.colors.onPrimary } }
				/>
			}
		} ) }
	</Menu>;
};

const TopAppBar = ( {
	setTopAppBarHeight,
} : {
	setTopAppBarHeight: Dispatch<SetStateAction<number>>;
} ) => {

	const { t } = useTranslation();

    const {
		selectedHierarchyItems,
		setSelectedHierarchyItems,
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
		{ selectedHierarchyItems && <Appbar.BackAction onPress={ backAction } /> }

        <Appbar.Content title={ selectedHierarchyItems
            ? [...selectedHierarchyItems].map( item => t( item.label ) ).join( ' / ' )
            : ''    // Empty element, but moves the menu right
        } />

		{ setSelectedHierarchyItems && <TopAppBarMenu
			selectedHierarchyItems={ selectedHierarchyItems }
			setSelectedHierarchyItems={ setSelectedHierarchyItems }
			items={ menuItems }
			anchorIcon="dots-vertical"
		/> }
	</Appbar>;
}

export default TopAppBar;