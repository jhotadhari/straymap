/**
 * External dependencies
 */
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
	useWindowDimensions,
	View,
    TouchableHighlight,
} from 'react-native';
import {
    List,
	useTheme,
    Text,
    Icon,
    Menu,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { get } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerMapsforge, MapLayerMapsforgeModule, RenderStyleOptionsCollection } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsMapsforge, MapSettings, MapsforgeProfile, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';
import { AppContext, SettingsMapsContext } from '../Context';
import RadioListItem from './RadioListItem';
import InfoButton from './InfoButton';
import IconIcomoon from './IconIcomoon';
import NameRowControl from './NameRowControl';
import FileSourceRowControl from './FileSourceRowControl';
import MenuItem from './MenuItem';

const itemHeight = 50;

const DraggableItem = ( {
    width,
    profile,
} : {
    profile: MapsforgeProfile;
    width: number;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

    const { setEditProfile, layers, profiles } = useContext( SettingsMapsContext );

    let themeLabel = '';
    if ( profile.theme ) {
        const themeArr = profile.theme.split( '/' );
        themeLabel = themeArr[themeArr.length-1];
    }

    let layersCount = layers.filter( lay => lay.type === 'mapsforge' && get( lay.options as LayerConfigOptionsMapsforge, 'profile' ) === profile.key ).length;
    if ( profiles.length && profiles[0].key === profile.key ) {
        layersCount = layersCount + layers.filter( lay => lay.type === 'mapsforge' && get( lay.options as LayerConfigOptionsMapsforge, 'profile' ) === 'default' ).length;
    }

    return <View
        style={ {
            width,
            height: itemHeight,
            justifyContent:'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            marginLeft: -34,
            paddingLeft: 3,
            paddingRight: 17,
        } }
        key={ profile.key }
    >

        <View style={ {
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            flexGrow: 1,
            marginLeft: 5,
            marginRight: 5,
        } } >
            <Text style={ { marginLeft: 40 } } >{ profile.name }</Text>
            <Text>{ sprintf( '%s ' + t( 'layer', { count: layersCount } ), layersCount ) }</Text>
            <Text>[{ themeLabel }]</Text>
        </View>

        <TouchableHighlight
            underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => setEditProfile && setEditProfile( profile ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
        >
            <Icon
                source="cog"
                size={ 25 }
            />
        </TouchableHighlight>

    </View>;
};

const getDefaultSelectedOpt = ( profile: MapsforgeProfile, opts: OptionBase[], defaultRenderStyle: ( string | null ) ) => {
    let defaultSelected = null;
    if ( profile.renderStyle ) {
        defaultSelected = get( opts.find( opt => opt.key === profile.renderStyle ), 'key', null );
        if ( defaultSelected ) {
            return defaultSelected;
        }
    }
    return opts.length && defaultRenderStyle ? get( opts.find( opt => opt.key === defaultRenderStyle ), 'key', null ) : null;
};

const LayerCountRow = ( {
    profile,
    profiles,
    layers,
} : {
    profile: MapsforgeProfile;
    profiles: MapsforgeProfile[];
    layers: LayerConfig[];
} ) => {
    const { t } = useTranslation();
    const isDefaultProfile = profiles.length && profiles[0].key === profile.key;
    const layersCount = layers.filter( lay => lay.type === 'mapsforge' && get( lay.options as LayerConfigOptionsMapsforge, 'profile' ) === profile.key ).length;
    const layersCountDefault = isDefaultProfile ? layers.filter( lay => lay.type === 'mapsforge' && get( lay.options as LayerConfigOptionsMapsforge, 'profile' ) === 'default' ).length : 0;
    return <InfoRowControl
        label={ t( 'layer', { count: 0 } ) }
    >
        <View style={ { paddingLeft: 12 } }>
            <Text style={ { maxWidth: '80%'} }>{ sprintf( t( 'layerSelectedCount', { count: layersCount } ), layersCount ) }</Text>
            { isDefaultProfile && <Text style={ { maxWidth: '80%', marginTop: 10 } }>{ sprintf( t( 'layerSelectedDefaultCount', { count: layersCountDefault } ), layersCountDefault ) }</Text> }
        </View>
    </InfoRowControl>
};

const RenderStyleRowControl = ( {
    profile,
    updateProfile,
    Info,
    renderStyleOptionsMap,
    renderDefaultStylesMap,
    AlternativeButton,
} : {
    profile: MapsforgeProfile;
    updateProfile?: ( newProfile: MapsforgeProfile ) => void;
    Info?: ReactNode | string;
    AlternativeButton?: ReactNode;
    renderStyleOptionsMap: { [value: string]: RenderStyleOptionsCollection };
    renderDefaultStylesMap: { [value: string]: ( string | null ) };
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

    const renderStyleOptions = profile.theme ? renderStyleOptionsMap[profile.theme] : null;
    const [opts,setOpts] = useState<OptionBase[]>( [] );

    useEffect( () => {
        if ( profile.theme && renderStyleOptions ) {
            setOpts( Object.keys( renderStyleOptions ).map( key => ( { key, label: key } ) ) );
        }
    }, [profile.theme, renderStyleOptions] );

    const defaultRenderStyle = profile.theme ? get( renderDefaultStylesMap, profile.theme, null ) : null;

    const [selectedOpt,setSelectedOpt] = useState( getDefaultSelectedOpt( profile, opts, defaultRenderStyle ) );
    useEffect( () => {
        if ( opts.length && ( null === selectedOpt || ! opts.find( opt => opt.key === selectedOpt ) ) ) {
            setSelectedOpt( getDefaultSelectedOpt( profile, opts, defaultRenderStyle ) );
        }
    }, [
        profile,
        opts,
        defaultRenderStyle,
        selectedOpt,
    ] );

	const [menuVisible,setMenuVisible] = useState( false );

    useEffect( () => {
        if ( selectedOpt && updateProfile ) {
            updateProfile( {
                ...profile,
                renderStyle: selectedOpt,
            } );
        }
    }, [selectedOpt] );

    return opts.length > 0 ? <InfoRowControl
        label={ t( 'style' ) }
        Info={ Info }
    >
        { ! AlternativeButton && <Menu
            contentStyle={ {
                borderColor: theme.colors.outline,
                borderWidth: 1,
            } }
            visible={ menuVisible }
            onDismiss={ () => setMenuVisible( false ) }
            anchor={ <ButtonHighlight style={ { marginTop: 3} } onPress={ () => setMenuVisible( true ) } >
                <Text>{ t( get( opts.find( opt => opt.key === selectedOpt ), 'label', '' ) ) }</Text>
            </ButtonHighlight> }
        >
            { opts && [...opts].map( opt => <MenuItem
                key={ opt.key }
                onPress={ () => {
                    setSelectedOpt( opt.key );
                    setMenuVisible( false );
                } }
                title={ t( opt.label ) }
                active={ opt.key === selectedOpt }
            /> ) }
        </Menu> }

        { AlternativeButton && AlternativeButton }
    </InfoRowControl> : null;
};

const RenderOverlaysRowControl = ( {
    profile,
    updateProfile,
    Info,
    label,
    header,
    renderStyleOptionsMap,
    AlternativeButton,
} : {
    profile: MapsforgeProfile;
    updateProfile?: ( newProfile: MapsforgeProfile ) => void;
    Info?: ReactNode | string;
    label: string;
    header?: string;
    AlternativeButton?: ( {
        setModalVisible
    } : {
        setModalVisible?: Dispatch<SetStateAction<boolean>>
    } ) => ReactNode;
    renderStyleOptionsMap: { [value: string]: RenderStyleOptionsCollection };
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

    const renderStyleOptions = profile.theme ? renderStyleOptionsMap[profile.theme] : null;
    const [opts,setOpts] = useState<OptionBase[]>( [] );
    const [selectedOpts,setSelectedOpts] = useState( profile.renderOverlays );

    useEffect( () => {
        if ( profile.theme && profile.renderStyle && renderStyleOptions ) {
            const optsMap : { [value: string]: string } = get( renderStyleOptions, [profile.renderStyle,'options'], {} ) as { [value: string]: string };
            setOpts( Object.keys( optsMap ).map( key => ( { key, label: optsMap[key] } ) ) );
        }
        if ( ! profile.theme || ! profile.renderStyle || ! get( renderStyleOptions, [profile.renderStyle,'options'], false ) ) {
            setOpts( [] );
        }
    }, [profile.theme, profile.renderStyle, renderStyleOptions] );

    useEffect( () => {
        setSelectedOpts( profile.renderOverlays || [] );
    }, [opts] );

	const [modalVisible, setModalVisible] = useState( false );

    useEffect( () => {
        updateProfile && updateProfile( {
            ...profile,
            renderOverlays: selectedOpts,
        } );
    }, [selectedOpts] );

    return opts.length > 0 ? <InfoRowControl
        label={ label }
        Info={ Info }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
            header={ header || label }
        >
            <View style={ { flexDirection: 'row', justifyContent: 'space-between' } }>
                { selectedOpts.length > 0 && selectedOpts.length < opts.length && <ButtonHighlight
                    style={ { marginTop: 10, marginBottom: 40 } }
                    onPress={ () => {
                        setSelectedOpts( [...opts].filter( opt => ! selectedOpts.includes( opt.key ) ).map( opt => opt.key ) );
                    } }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'primaryContainer' ) }
                    textColor={ get( theme.colors, 'onPrimaryContainer' ) }
                ><Text>{ t( 'select.toggle' ) }</Text></ButtonHighlight>  }

                <ButtonHighlight
                    style={ { marginTop: 10, marginBottom: 40, marginLeft: 'auto' } }
                    onPress={ () => {
                        if ( selectedOpts.length < opts.length ) {
                            setSelectedOpts( [...opts].map( opt => opt.key ) );
                        } else {
                            setSelectedOpts( [] );
                        }
                    } }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'primaryContainer' ) }
                    textColor={ get( theme.colors, 'onPrimaryContainer' ) }
                ><Text>{ t( selectedOpts.length < opts.length ? 'select.all' : 'select.none' ) }</Text></ButtonHighlight>
            </View>

            { opts.length > 0 && <View>
                { [...opts].map( ( opt, index ) => {
                    const isSelected = selectedOpts.includes( opt.key );
                    return <RadioListItem
                        key={ opt.key }
                        opt={ opt }
                        onPress={ () => {
                            if ( isSelected ) {
                                const newSelectedOpts = [...selectedOpts];
                                newSelectedOpts.splice( index, 1 );
                                setSelectedOpts( newSelectedOpts );
                            } else {
                                setSelectedOpts( [
                                    ...selectedOpts,
                                    opt.key,
                                ] );
                            }
                        } }
                        labelStyle={ theme.fonts.bodyMedium }
                        labelExtractor={ a => a.label }
                        status={ isSelected ? 'checked' : 'unchecked' }
                    />
                } ) }
            </View> }

            <ButtonHighlight
                style={ { marginTop: 10, marginBottom: 40 } }
                onPress={ () => {
                    setModalVisible( false );
                } }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            { ! AlternativeButton && <ButtonHighlight
                disabled={ ! opts.length }
                style={ { marginTop: 3} }
                onPress={ () => setModalVisible( true ) }
            >
                <Text>{ opts.length === selectedOpts.length
                    ? t( 'selected.all' )
                    : ( 0 === selectedOpts.length
                        ? t( 'selected.none' )
                        : t( selectedOpts ? ( sprintf( t( 'selected.count' ), selectedOpts.length + '/' + opts.length ) ) : 'selected.none' )
                    )
                }</Text>
            </ButtonHighlight> }

            { AlternativeButton && <AlternativeButton setModalVisible={ setModalVisible } /> }
        </View>

    </InfoRowControl> : null;
};

const MapsforgeProfilesControl = () => {

    const {
        editProfile,
        setEditProfile,
        updateProfile,
        profiles,
        setProfiles,
        saveProfiles,
        getNewProfile,
        layers,
    } = useContext( SettingsMapsContext );

    const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const theme = useTheme();

    const { appDirs } = useContext( AppContext );

    const [modalOpened,setModalOpened] = useState( false )
	const [modalVisible, setModalVisible_] = useState( false );

    const [isNewKey,setIsNewKey] = useState<null | string>( null );

    useEffect( () => {
        if ( editProfile ) {
            setModalVisible( true );
        } else {
            setIsNewKey( null );
            setModalVisible( false );
        }
    }, [editProfile] );

	const [expanded, setExpanded] = useState( true );

    const setModalVisible = ( visible: boolean ) => {
        if ( visible ) {
            setModalVisible_( visible );
        } else {
            setModalOpened( visible );
            setModalVisible_( visible );
        }
    };


    const [isBusy,setIsBusy] = useState( false );
    const [renderStyleOptionsMap,setRenderStyleOptionsMap] = useState<{ [value: string]: RenderStyleOptionsCollection }>( {} );
    const [renderDefaultStylesMap,setRenderDefaultStylesMap] = useState<{ [value: string]: ( string | null ) }>( {} );

	useEffect( () => {
        if ( editProfile && null !== editProfile.theme && modalOpened ) {
            if ( ! renderStyleOptionsMap[editProfile.theme] ) {
                setIsBusy( true );
                setTimeout( () => {
                    MapLayerMapsforgeModule.getRenderThemeOptions( editProfile?.theme ).then( ( collection : RenderStyleOptionsCollection ) => {
                        setRenderStyleOptionsMap( {
                            ...renderStyleOptionsMap,
                            ...( 'string' === typeof editProfile.theme && { [editProfile.theme]: collection } ),
                        } );
                        setRenderDefaultStylesMap( {
                            ...renderDefaultStylesMap,
                            ...( 'string' === typeof editProfile.theme && {
                                [editProfile.theme]: get( Object.values( collection ).find( obj => obj.default ), 'value', null ),
                            } ),
                        } );
                        setIsBusy( false );
                    } ).catch( ( err: any ) => console.log( 'ERROR', err ) );
                }, 1 );
            }
		}
    }, [editProfile?.theme, modalOpened] );

    const renderItem = ( profile : MapsforgeProfile ) => <View key={ profile.key }><DraggableItem
        profile={ profile }
        width={ width }
    /></View>;

    return <View>

        { editProfile && <ModalWrapper
            visible={ modalVisible }
            onLayout={ event => {

                setModalOpened( true );
                // console.log( 'debug event', event ); // debug
            } }
            onDismiss={ () => {
                setModalVisible( false );
                setIsNewKey( null );
                setEditProfile && setEditProfile( null );
            } }
            header={ isNewKey === editProfile.key ? t( 'map.mapsforge.profileAddNewShort' ) : t( 'map.mapsforge.profileEdit' ) }
        >
            <View>

                <NameRowControl
                    item={ editProfile }
                    update={ updateProfile as ( newItem: { name: string } ) => void }
                    Info={ isBusy ? undefined : <Text>{ 'bla blaa ??? info text' }</Text> }
                />

                <LayerCountRow
                    profile={ editProfile }
                    profiles={ profiles }
                    layers={ layers }
                />

                <FileSourceRowControl
                    AlternativeButton={ isBusy ? () => <Text>busy!!!???</Text> : undefined }
                    label={ t( 'theme' ) }
                    header={ t( 'selectTheme' ) }
                    initialOptsMap={ {
                        [ t( 'builtInThemes' ) + ':']: [...LayerMapsforge.BUILT_IN_THEMES].map( key => ( {
                            key,
                            label: key,
                        } ) )
                    } }
                    options={ editProfile }
                    optionsKey={ 'theme' }
                    onSelect={ selectedOpt => {
                        updateProfile && updateProfile( {
                            ...editProfile,
                            theme: selectedOpt,
                        } )
                    } }
                    filePattern={ /.*\.xml$/ }
                    dirs={ appDirs ? appDirs.mapstyles : [] }
                    Info={ isBusy ? undefined : <Text>{ 'bla blaa ??? info text' }</Text> }


                    filesHeading={ 'xml theme files in' }         // ??? translate
                    noFilesHeading={ 'No xml theme files in' }    // ??? translate
                />


                <RenderStyleRowControl
                    AlternativeButton={ isBusy ? <Text>busy!!!???</Text> : undefined }
                    Info={ isBusy ? undefined : <Text>{'bla blaa ??? info text'}</Text> }
                    profile={ editProfile }
                    updateProfile={ updateProfile }
                    renderStyleOptionsMap={ renderStyleOptionsMap }
                    renderDefaultStylesMap={ renderDefaultStylesMap }
                />

                <RenderOverlaysRowControl
                    AlternativeButton={ isBusy ? () => <Text>busy!!!???</Text> : undefined }
                    Info={ isBusy ? undefined : <Text>{'bla blaa ??? info text'}</Text> }
                    profile={ editProfile }
                    updateProfile={ updateProfile }
                    renderStyleOptionsMap={ renderStyleOptionsMap }
                    label={ t( 'overlay', { count: 1 } ) }
                />

                { ! isBusy && <View style={ { marginTop: 20, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>
                    <ButtonHighlight
                        onPress={ () => {
                            setEditProfile && setEditProfile( null );
                            setModalVisible( false );
                            setIsNewKey( null );
                        } }
                        mode="contained"
                        buttonColor={ get( theme.colors, 'successContainer' ) }
                        textColor={ get( theme.colors, 'onSuccessContainer' ) }
                    ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

                    <ButtonHighlight
                        onPress={ () => {
                            if ( profiles && setProfiles && setEditProfile ) {
                                const profileIndex = profiles.findIndex( profile => profile.key === editProfile.key )
                                if ( profileIndex !== -1 ) {
                                    const newProfiles = [...profiles];
                                    newProfiles.splice( profileIndex, 1 );
                                    setProfiles( newProfiles );
                                    setEditProfile( null );
                                    setModalVisible( false );
                                    setIsNewKey( null );
                                }
                            }
                        } }
                        mode="contained"
                        buttonColor={ theme.colors.errorContainer }
                        textColor={ theme.colors.onErrorContainer }
                    ><Text>{ t( 'map.mapsforge.profileRemove' ) }</Text></ButtonHighlight>
                </View> }

            </View>

        </ModalWrapper> }

        <List.Accordion
            title={ t( 'map.mapsforge.profile', { count: 0 } ) }
            left={ props => <IconIcomoon size={ 25 } name="mapsforge_puzzle_only" {...props}/> }
            expanded={ expanded }
            onPress={ () => {
                if ( expanded && saveProfiles ) {
                    saveProfiles();
                }
                setExpanded( ! expanded )
            } }
        >

            <View style={ {
                height: itemHeight * profiles.length + 8 ,
                width,
            } } >
                <DraggableGrid
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
                    renderItem={ renderItem }
                    data={ profiles }
                    onDragRelease={ ( newProfiles : MapsforgeProfile[] ) => {
                        setProfiles && setProfiles( newProfiles );
                    } }
                />
            </View>

            { ! profiles.length && <Text style={ { marginLeft: 18, marginBottom: 35 } } >{ t( 'map.mapsforge.profilesNone' ) }</Text>}

            <View
                style={ {
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    marginBottom: 25,
                } }
            >

                <InfoButton
                    label={ t( 'map.mapsforge.profile', { count: 0 } ) }
                    headerPlural={ true }
                    backgroundBlur={ true }
                    Info={ <Text>{ 'bla bla ??? info text' }</Text> }
                    buttonProps={ {
                        style: { marginTop: 0, marginBottom: 0, marginLeft: -30 },
                        icon: "information-variant",
                        mode: "outlined",
                        iconColor: theme.colors.primary,
                    } }
                />

                <ButtonHighlight
                    style={ { marginRight: 20 } }
                    icon="map-plus"
                    mode="outlined"
                    onPress={ () => {
                        if ( getNewProfile && setEditProfile && updateProfile ) {
                            const newEditProfile = getNewProfile();
                            setIsNewKey( newEditProfile.key );
                            setEditProfile( newEditProfile );
                            updateProfile( newEditProfile );
                        }
                    } }
                >
                    { t( 'map.mapsforge.profileAddNew' ) }
                </ButtonHighlight>
            </View>
        </List.Accordion>

    </View>;
};

export default MapsforgeProfilesControl;