/**
 * External dependencies
 */
import React, {
    useEffect,
    useState,
} from 'react';
import {
	Menu,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { View } from "react-native";
import convertUnits from "convert-units";

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../ButtonHighlight';
import MenuItem from '../../MenuItem';
import InfoRowControl from '../../InfoRowControl';
import { options as unitPrefControlOptions } from '../../UnitPrefControl';
import { DashboardDisplayComponentProps, DashboardElementConf, UnitPref } from "../../../types";
import { TFunction } from 'i18next';
import { roundTo } from '../../../utils';
import { NumericRowControl } from '../../NumericRowControls';

const opts = [
    {
        key: 'default',
        label: 'useUnitPref',
    },
    ...unitPrefControlOptions.heightDepth,
];

const ControlComponent = ( {
    editElement,
    updateElement,
    unitPrefs,
} : {
    editElement: null | DashboardElementConf;
    updateElement: ( newElement : DashboardElementConf ) => void;
    unitPrefs?: { [value: string]: UnitPref };
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();
    const [menuVisible,setMenuVisible] = useState( false );

    const activeOpt = opts.find( opt => opt.key === get( editElement, ['options','unit','key'] ) );

    const presetUnit = () => {
        if ( ! activeOpt ) {
            const newEditElement = {...editElement}
            set( newEditElement, ['options','unit','key'], 'default' );
            set( newEditElement, ['options','unit','round'], 2 );
            updateElement( newEditElement as DashboardElementConf );
        }
    };
    useEffect( () => presetUnit(), [] );
    useEffect( () => presetUnit(), [activeOpt] );

    return activeOpt ? <View>

        <InfoRowControl
            label={ t( 'unit' ) }
            // Info={ <Text>{ 'bla bla ??? info text' }</Text> }
        >
            <Menu
                contentStyle={ {
                    borderColor: theme.colors.outline,
                    borderWidth: 1,
                } }
                visible={ menuVisible }
                onDismiss={ () => setMenuVisible( false ) }
                anchor={ <ButtonHighlight style={ { marginTop: 3, alignItems: 'flex-start' } } onPress={ () => setMenuVisible( true ) } >
                    <Text>{ t( get( activeOpt, 'label', '' ) ) }</Text>
                </ButtonHighlight> }
            >
                { [...opts].map( opt => <MenuItem
                    key={ opt.key }
                    onPress={ () => {
                        setMenuVisible( false );
                        const newEditElement = {...editElement}
                        set( newEditElement, ['options','unit','key'], opt.key );
                        updateElement( newEditElement as DashboardElementConf );
                    } }
                    title={ t( opt.label ) }
                    active={ activeOpt ? opt.key === activeOpt.key : false }
                    style={ 'default' === activeOpt.key && unitPrefs && unitPrefs?.heightDepth?.unit === opt.key ? {
                        borderLeftColor: theme.colors.primary,
                        borderLeftWidth: 5,
                    } : {} }
                /> ) }
            </Menu>
        </InfoRowControl>

        { activeOpt && 'default' !== activeOpt.key && <NumericRowControl
            label={ upperFirst( t( 'decimalPlace', { count: 0 } ) ) }
            optKey={ 'round' }
            options={ get( editElement, ['options','unit'], {} ) }
            setOptions={ newUnit => {
                const newEditElement = {...editElement}
                set( newEditElement, ['options','unit'], newUnit );
                updateElement( newEditElement as DashboardElementConf );
            } }
            validate={ val => val >= 0 }
        /> }

    </View> : null;
};

const formatOutput = ( altitudeM: ( number | null ), unit: UnitPref, t: TFunction<"translation", undefined> ): string => {
    if ( null === altitudeM ) {
        return '-';
    }
    switch( unit.unit ){
        case 'ft':
            return roundTo( convertUnits( altitudeM ).from( 'm' ).to( 'ft' ), unit.round )  + ' ft';
        case 'fath':
            return roundTo( altitudeM * 0.5468066492, unit.round )  + ' fathom';
        default:
            return roundTo( altitudeM, unit.round ) + ' m';
    }
};

const DisplayComponent = ( {
    currentMapEvent,
    dashboardElement,
    style = {},
    unitPrefs,
} : DashboardDisplayComponentProps ) => {

    const { t } = useTranslation();

    const unit = 'default' === get( dashboardElement, ['options','unit','key'], 'default' )
        ? {
            ...get( unitPrefs, 'heightDepth' ),
            key: get( unitPrefs, ['heightDepth','unit'] ),
        }
        : {
            ...get( dashboardElement, ['options','unit'] ),
            unit: get( dashboardElement, ['options','unit','key'] ),
        };

    return <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        { currentMapEvent.center && currentMapEvent?.center.hasOwnProperty( 'alt' ) && <Text style={ {
            fontSize: get( dashboardElement, ['style','fontSize'], undefined ),
        } }>{
            formatOutput( currentMapEvent.center.alt as ( number | null ), unit, t )
        }</Text> }
    </View>;
};

export default {
    key: 'centerAltitude',
    label: 'centerAltitude',
    DisplayComponent,
    ControlComponent,
    hasStyleControl: true,
    shouldSetHgtDirPath: true,
    defaultWidth: 75,
    responseInclude: { center: 2 },
};
