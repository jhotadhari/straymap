
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
    useState,
} from 'react';
import {
	LayoutRectangle,
	useWindowDimensions,
	View,
} from 'react-native';
import {
    List,
    Menu,
	Icon,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { OptionBase, SettingsItem } from '../types';

const menuMarginRight = 25;
const menuMarginTop = 10;

const ListItemMenuControl = ( {
	options,
	value,
	setValue,
	anchorLabel,
	anchorIcon,
} : {
	anchorLabel: string;
	options?: OptionBase[];
	value?: string;
	setValue?: ( ( newValue: string ) => void )
	anchorIcon?: ( ( props: {
		color: string;
		style: ListStyle;
	}) => React.ReactNode );
} ) => {

	const { t } = useTranslation();
	const theme = useTheme();
	const [visible,setVisible] = useState( false );
	const [layout,setLayout] = useState<null | LayoutRectangle>( null )
    const { topAppBarHeight } = useContext( AppContext )
	return <View onLayout={ e => setLayout( e.nativeEvent.layout ) } >
		<List.Item
			title={ anchorLabel }
			// description={ item.description ? t( item.description ) : null }
			left={ anchorIcon ? anchorIcon : undefined }
			onPress={ () => setVisible( ! visible ) }
		/>
		{ layout && <Menu
			contentStyle={ {
				borderColor: theme.colors.outline,
				borderWidth: 1,
			} }
			visible={ visible }
			onDismiss={ () => setVisible( false ) }
			anchor={ {
				x: layout.x + layout.width - menuMarginRight,
				y: layout.y + menuMarginTop + ( topAppBarHeight ? topAppBarHeight : 0 ) }
			}
		>
			{ options && setValue && [...options].map( opt => <Menu.Item
				key={ opt.key }
				onPress={ () => {
					setValue( opt.key );
					setVisible( false );
				} }
				title={ opt.label }
				style={ opt.key === value && { backgroundColor: theme.colors.primary } }
				titleStyle={ opt.key === value && { color: theme.colors.onPrimary } }
			/> ) }
		</Menu> }
	</View>;

};

const SettingsGeneral : FC = () => {

	const theme = useTheme();
	const { width } = useWindowDimensions();
	const { t } = useTranslation();
    const {
        mapHeight,
		langOptions,
		changeLang,
		selectedLang,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectLang' ) }
			options={ langOptions }
			setValue={ changeLang }
			value={ selectedLang }
			anchorIcon={ ( { style, color } ) => <MaterialIcons style={ style } name="language" size={ 25 } color={ color } /> }
		/>

	</View>;
};

const SettingsAppearance : FC = () => {

	const theme = useTheme();
	const { width } = useWindowDimensions();
	const { t } = useTranslation();
    const {
        mapHeight,
        selectedTheme,
        setSelectedTheme,
        themeOptions,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectTheme' ) }
			options={ themeOptions }
			setValue={ setSelectedTheme }
			value={ selectedTheme }
			anchorIcon={ ( { color, style } ) => <View style={ style }><Icon
				source="invert-colors"
				color={ color }
				size={ 25 }
			/></View> }
		/>

	</View>;
};

const settingsPages : SettingsItem[] = [
	{
		key: 'general',
		label: 'settings.general',
        left: props => <List.Icon {...props} icon="application-cog-outline" />,
		SubActivity: <SettingsGeneral/>,
	},
	{
		key: 'appearance',
        label: 'settings.appearance',
        left: ( { color, style } ) => <MaterialIcons style={ style } name="style" size={ 25 } color={ color } />,
        SubActivity: <SettingsAppearance/>,
	},
];

const Settings : FC = () => {

	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useWindowDimensions();
    const {
        mapHeight,
		selectedHierarchyItems,
		setSelectedHierarchyItems,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >
        { [...settingsPages].map( ( item, index ) => <List.Item
			key={ index }
			title={ t( item.label ) }
			description={ item.description ? t( item.description ) : null }
			left={ item.left ? item.left : undefined }
			onPress={ () => setSelectedHierarchyItems ? setSelectedHierarchyItems( [
				...( selectedHierarchyItems ? selectedHierarchyItems : [] ),
				item,
			] ) : null }
		/> ) }
	</View>;
};

export default Settings;