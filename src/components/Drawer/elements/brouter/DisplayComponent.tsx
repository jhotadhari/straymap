/**
 * External dependencies
 */
import React, { Dispatch, SetStateAction, useContext, useMemo, useState } from 'react';
import {
    Icon,
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableHighlight, View } from "react-native";
import formatcoords from 'formatcoords';
import { sprintf } from 'sprintf-js';
import DraggableGrid from 'react-native-draggable-grid';
import { get, omit } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';

/**
 * Internal dependencies
 */
import { AppContext, RoutingContext } from '../../../../Context';
import ButtonHighlight from '../../../generic/ButtonHighlight';
import { DrawerState, RoutingPoint, RoutingSegment } from '../../../../types';
import ModalWrapper from '../../../generic/ModalWrapper';
import LoadingIndicator from '../../../generic/LoadingIndicator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ListItemMenuControl from '../../../generic/ListItemMenuControl';
import InfoRowControl from '../../../generic/InfoRowControl';
import InfoRadioRow from '../../../generic/InfoRadioRow';
import { formatDistance } from '../../../../utils';

const itemHeight = 130;
const itemPaddingH = 20;

const DraggableItem = ( {
    item,
    width,
    order,
    draggingItemIndex,
    // editSegment,
    setEditSegment,
} : {
    item: RoutingPoint;
    width: number;
    order: number;
    draggingItemIndex: null | number;
    // editSegment: null | RoutingSegment;
    setEditSegment: Dispatch<SetStateAction<null | RoutingSegment>>;
} ) => {

    const theme = useTheme();

    const {
        points,
        setPoints,
        segments,
        setSegments,
        triggerSegmentsUpdate,
    } = useContext( RoutingContext );

    const {
        generalSettings,
    } = useContext( AppContext );

    const segmentIdx = segments ? segments.findIndex( segment =>
        segment.fromKey === item.key
    ) : -1;
    const segment = segments && -1 !== segmentIdx ? segments[segmentIdx] : undefined;

    let StateIcon : null | React.JSX.Element = null;
    switch( true ) {
        case ( !! ( segment && segment?.errorMsg ) ):
            // error
            StateIcon = <MaterialIcons
                name="error"
                size={ 25 }
                color={ theme.colors.errorContainer }
            />;
            break;
        case ( !! ( segment && segment?.isFetching ) ):
            // fetching
            StateIcon = <LoadingIndicator style={ { marginRight: 1, paddingTop: 1 } }/>;
            break;
        case ( ! segment || ! segment?.positions ):
            // some placeholder until start fetching
            StateIcon = <Icon
                source="dots-horizontal"
                size={ 25 }
            />;
            break;
        case ( !! ( segment && ! segment?.isFetching && segment?.positions ) ):
            // ok
            StateIcon = <Icon
                source="check"
                size={ 25 }
                color={ get( theme, ['colors','success'], undefined ) }
            />;
            break;
    }

    return <View
        style={ {
            width,
            height: itemHeight,
            // justifyContent:'space-between',
            alignItems: 'center',
            justifyContent: 'flex-start',
            // flexDirection: 'row',
            marginLeft: - itemPaddingH * 2,
            paddingHorizontal: itemPaddingH,
        } }
        key={ item.key }
    >
        <View style={ {
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
            // width: width - itemPaddingH * 2,
            // marginLeft: itemPaddingH,
        } } >

            <View style={ { flexDirection: 'row', flexGrow: 1 } }>
                <Text style={ { marginRight: 10 } }>{ order + 1 }</Text>

                <Text>{ formatcoords( item.location ).format( 'dd',{
                    decimalPlaces: 4,
                } ) }</Text>
            </View>

            <View style={ {
                flexDirection: 'row',
            } }>
                <TouchableHighlight
                    underlayColor={ theme.colors.elevation.level3 }
                    onPress={ () => {
                        if (
                            setPoints
                            && points
                            && undefined !== order
                            && points.length >= order + 1
                        ) {
                            const newPoints = [...points];
                            newPoints.splice( order, 1 );
                            setPoints( newPoints );
                        }
                    } }
                    style={ { padding: 10, borderRadius: theme.roundness } }
                >
                    <Icon
                        source="delete"
                        size={ 25 }
                    />
                </TouchableHighlight>
            </View>

        </View>

        { segment && (
            null === draggingItemIndex || (
                draggingItemIndex !== order
                && draggingItemIndex - 1 !== order
            )
        ) && <View style={ {
            alignItems: 'center',
            // position: 'relative',
            justifyContent: 'flex-start',
            backgroundColor: theme.colors.surfaceDisabled,
            // marginLeft: -8,
            // paddingRight: itemPaddingH + 1,
            // paddingLeft: 20,
            width: width - itemPaddingH * 2 - 10,
            marginRight: -5,
            borderLeftWidth: 1,
            borderColor: theme.colors.onSurfaceDisabled,
        } }>
            <View style={ {
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
                // width: width - itemPaddingH * 2,
                // marginLeft: itemPaddingH,
            } }>
                <View style={ { marginRight: -4, padding: 10 } }>{ StateIcon ? StateIcon : null }</View>

                { segment?.errorMsg && <Text style={ { marginRight: 10, flexGrow: 1 } }>{ 'Error' + ': ' + segment?.errorMsg }</Text> }

                <Text style={ { marginRight: 10, flexGrow: 1 } }>
                    { segment?.coordinatesSimplified
                        && segment.coordinatesSimplified.length > 0
                        && undefined !== segment.coordinatesSimplified[segment.coordinatesSimplified.length-1].distance
                        && undefined !== generalSettings?.unitPrefs.distance ? formatDistance(
                            segment.coordinatesSimplified[segment.coordinatesSimplified.length-1].distance || 0,
                            generalSettings?.unitPrefs.distance
                    ) : '' }
                </Text>

                {/* { ! segment?.isFetching && segment?.positions && <Text style={ { marginRight: 10, flexGrow: 1 } }>{ 'positions' + ': ' + segment?.positions.length }</Text> } */}

                <ButtonHighlight
                    // mode='outlined'
                    compact={ true }
                    onPress={ () => {
                        if ( segments && setSegments && -1 !== segmentIdx && segments.length > segmentIdx ) {
                            const newSegments = [...segments];
                            newSegments.splice( segmentIdx, 1, omit( {
                                ...newSegments[segmentIdx],
                                isFetching: false,
                            }, ['positions'] ) );
                            setSegments( newSegments );
                            triggerSegmentsUpdate && triggerSegmentsUpdate();
                        }
                    } }
                >
                    <Icon
                        source="refresh"
                        size={ 25 }
                    />
                </ButtonHighlight>



            </View>

            <View style={ {
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
            } }>

                <ButtonHighlight
                    // style={ { marginLeft: -17 } }
                    compact={ true }
                    onPress={ () => setEditSegment( segment ) }
                >
                    <Icon
                        source="cog"
                        size={ 25 }
                    />
                </ButtonHighlight>

                <View style={ {
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    flexDirection: 'row',
                    flexGrow: 1,
                } }>
                    { Object.keys( segment.profile ).map( profileKey => {
                        let inner: string | boolean = get( segment.profile, profileKey, '' );
                        if ( 'fast' === profileKey ) {
                            inner = inner
                                ? 'fast'
                                : 'slow';
                        }
                        if ( 'string' !== typeof inner ) {
                            inner = profileKey;
                        }
                        return <Text key={ profileKey } style={ { marginRight: 10 } }>{ inner }</Text>;
                    } ) }
                </View>
            </View>

        </View> }

    </View>;
};

const PointsList = ( {
    drawerWidth,
    setScrollEnabled,
    // editSegment,
    setEditSegment,
} : {
	drawerWidth: number;
    setScrollEnabled: Dispatch<SetStateAction<boolean>>;
    // editSegment: null | RoutingSegment;
    setEditSegment: Dispatch<SetStateAction<null | RoutingSegment>>;
} ) => {

    const {
        points,
        setPoints,
    } = useContext( RoutingContext );

    const [draggingItemIndex,setDraggingItemIndex] = useState<null | number>( null );

    const renderItem = ( item : RoutingPoint, order: number ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ drawerWidth }
        order={ order }
        draggingItemIndex={ draggingItemIndex }
        // editSegment={ editSegment }
        setEditSegment={ setEditSegment }
    /></View>;

    return points ? <View style={ {
        height: itemHeight * points.length + 8 ,
        width: drawerWidth,
    } } >
        <DraggableGrid
            style={ { width: drawerWidth } }
            itemHeight={ itemHeight }
            numColumns={ 1 }
            renderItem={ renderItem }
            data={ points }
            onDragStart={ ( item: RoutingPoint ) => {
                setScrollEnabled( false );
                const newDraggingItemIndex = points.findIndex( point => point.key === item.key );
                setDraggingItemIndex( -1 === newDraggingItemIndex ? null : newDraggingItemIndex );
            } }
            onDragRelease={ ( newPoints : RoutingPoint[] ) => {
                setScrollEnabled( true );
                setPoints && setPoints( newPoints );
                setDraggingItemIndex( null );
            } }
        />
    </View> : null;
};

const ProfileRowControl = ( {
    editSegment,
    setEditSegment,
} : {
    editSegment: RoutingSegment;
    setEditSegment: Dispatch<SetStateAction<null | RoutingSegment>>;
} ) => {

    const { t } = useTranslation();

    const options = useMemo( () => [
        {
            key: 'motorcar',
            label: 'motorcar',
        },
        {
            key: 'bicycle',
            label: 'bicycle',
        },
        {
            key: 'foot',
            label: 'foot',
        },
    ], [] );

    const selectedOpt = options.find( opt => opt.key === editSegment.profile.v );

    return <InfoRowControl
        label={ t( 'profile???' ) }
    >
        <ListItemMenuControl
            options={ options }
            value={ get( selectedOpt, 'key' ) }
            setValue={ newValue => setEditSegment( {
                ...editSegment,
                profile: {
                    ...editSegment.profile,
                    v: newValue as GetTrackParams['v'],
                }
            } ) }
            anchorLabel={ get( selectedOpt, 'label', '' ) }
        />
    </InfoRowControl>;
};

const DisplayComponent = ( {
	drawerWidth,
	drawerHeight,
	drawerSide,
	expand,
} : {
	drawerWidth: number;
	drawerHeight: number;
	drawerSide: string;
    expand: DrawerState['expand'];
} ) => {

    const {
        savedExported,
        setMovingPointIdx,
        isRouting,
        setIsRouting,
        points,
        segments,
        setSegments,
        triggerSegmentsUpdate,
    } = useContext( RoutingContext );

    const theme = useTheme();
    const { t } = useTranslation();

	const [dismissModalVisible, setDismissModalVisible] = useState( false );
    const [scrollEnabled,setScrollEnabled] = useState( true );
    const [editSegment,setEditSegment] = useState<null | RoutingSegment >( null );

    const updateSegment = () => {
        if ( segments && editSegment && setSegments ) {
            const segmentIdx = segments.findIndex( segment => segment.key === editSegment.key );
            if ( -1 !== segmentIdx ) {
                if ( JSON.stringify( segments[segmentIdx].profile ) !== JSON.stringify( editSegment.profile ) ) {
                    const newSegments = [...segments];
                    newSegments.splice( segmentIdx, 1, omit( editSegment, ['positions'] ) );
                    setSegments( newSegments );
                    triggerSegmentsUpdate && triggerSegmentsUpdate();
                }
            }
        }
    };

    return <ScrollView
        scrollEnabled={ scrollEnabled }
        style={ {
            backgroundColor: theme.colors.background,
            height: drawerHeight - 50,
            width: drawerWidth,
            position: 'absolute',
            marginTop: 3,
            paddingHorizontal: 20,
        } }
    >

        { editSegment && <ModalWrapper
            visible={ !! editSegment }
            onDismiss={ () => {
                updateSegment();
                setEditSegment( null );
            } }
            onHeaderBackPress={ () => {
                updateSegment();
                setEditSegment( null );
            } }
            header={ 'editProfile???' }
        >

            <ProfileRowControl
                editSegment={ editSegment }
                setEditSegment={ setEditSegment }
            />

            <InfoRadioRow
                opt={ {
                    label: t( 'fast' ),
                    key: 'fast',
                } }
                onPress={ () => setEditSegment( {
                    ...editSegment,
                    profile: {
                        ...editSegment.profile,
                        fast: ! editSegment.profile.fast,
                    }
                } ) }
                labelStyle={ theme.fonts.bodyMedium }
                labelExtractor={ a => a.label }
                status={ editSegment.profile.fast ? 'checked' : 'unchecked' }
                radioAlign={ 'left' }
                Info={ t( 'hint.maps.hgtInterpolation' ) }
            />

        </ModalWrapper> }

        { dismissModalVisible && <ModalWrapper
            visible={ dismissModalVisible }
            onDismiss={ () => setDismissModalVisible( false ) }
            onHeaderBackPress={ () => setDismissModalVisible( false ) }
            header={ 'sicher???' }
        >
            <View style={ { marginTop: 20 } }>
                <Text style={ { marginBottom: 20 } }>{ 'sicher das du routing abbrechen möchtest???' }</Text>
                { Object.keys( savedExported || {} ).map( key => ! get( savedExported, key )
                    ? <Text key={ key } style={ { marginBottom: 20 } }>{ sprintf( 'The route is not %s. ???', key ) }</Text>
                    : null
                ) }
            </View>

            <View style={ { marginTop: 20, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>
                <ButtonHighlight
                    onPress={ () => setDismissModalVisible( false ) }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'successContainer' ) }
                    textColor={ get( theme.colors, 'onSuccessContainer' ) }
                ><Text>{ t( 'continue???' ) }</Text></ButtonHighlight>

                <ButtonHighlight
                    onPress={ () => {
                        expand( false );
                        setDismissModalVisible( false );
                        setIsRouting && setIsRouting( false );
                        setMovingPointIdx && setMovingPointIdx( undefined );
                    } }
                    mode="contained"
                    buttonColor={ theme.colors.errorContainer }
                    textColor={ theme.colors.onErrorContainer }
                ><Text>{ t( 'stopRouting???' ) }</Text></ButtonHighlight>
            </View>
        </ModalWrapper> }

        <ButtonHighlight
            style={ { marginBottom: 20 } }
            mode='outlined'
            onPress={ () => {
                if ( isRouting ) {
                    if ( points && points.length && Object.values( savedExported || {} ).includes( false ) ) {
                        setDismissModalVisible( true );
                    } else {
                        expand( false );
                        setIsRouting && setIsRouting( false );
                    }
                } else {
                    expand( false );
                    setIsRouting && setIsRouting( true );
                }
            } }
        >
            <Text>{ t( isRouting ? 'stopRouting???' : 'startRouting???'  ) }</Text>
        </ButtonHighlight>

        { ! isRouting && <ButtonHighlight
            style={ { marginBottom: 20 } }
            mode='outlined'
            onPress={ () => null }
        >
            <Text>{ t( 'load TODO???'  ) }</Text>
        </ButtonHighlight> }

        { isRouting && <View style={ {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        } }>
            <ButtonHighlight
                mode='outlined'
                onPress={ () => null }
            >
                <Text>{ t( 'save TODO???'  ) }</Text>
            </ButtonHighlight>

            <ButtonHighlight
                mode='outlined'
                onPress={ () => null }
            >
                <Text>{ t( 'export TODO???'  ) }</Text>
            </ButtonHighlight>
        </View> }

        { points && <PointsList
            setScrollEnabled={ setScrollEnabled }
            drawerWidth={ drawerWidth }
            // editSegment={ editSegment }
            setEditSegment={ setEditSegment }
        /> }

    </ScrollView>;
};

export default DisplayComponent;