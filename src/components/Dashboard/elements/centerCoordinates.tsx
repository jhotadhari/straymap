/**
 * External dependencies
 */
import React, {
    useContext,
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
import formatcoords from "formatcoords";

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../generic/ButtonHighlight';
import MenuItem from '../../generic/MenuItem';
import InfoRowControl from '../../generic/InfoRowControl';
import { NumericRowControl } from '../../generic/NumericRowControls';
import { options as unitPrefControlOptions } from '../../UnitPrefControl';
import { DashboardDisplayComponentProps, DashboardElementConf, UnitPref } from "../../../types";
import { MapContext } from '../../../Context';

const opts = [
    {
        key: 'default',
        label: 'useUnitPref',
    },
    ...unitPrefControlOptions.coordinates,
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
            set( newEditElement, ['options','unit','round'], 4 );
            updateElement( newEditElement as DashboardElementConf );
        }
    };
    useEffect( () => presetUnit(), [] );
    useEffect( () => presetUnit(), [activeOpt] );

    return activeOpt ? <View>

        <InfoRowControl
            label={ t( 'unit' ) }
            Info={ t( 'hint.dashboard.item.unit' ) }
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
                    style={ 'default' === activeOpt.key && unitPrefs && unitPrefs?.coordinates?.unit === opt.key ? {
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

const DisplayComponent = ( {
    dashboardElement,
    style = {},
    unitPrefs,
    dashboardStyle,
} : DashboardDisplayComponentProps ) => {

    const {
		currentMapEvent,
    } = useContext( MapContext );

    const unit = 'default' === get( dashboardElement, ['options','unit','key'], 'default' )
        ? {
            ...get( unitPrefs, 'coordinates' ),
            key: get( unitPrefs, ['coordinates','unit'] ),
        }
        : get( dashboardElement, ['options','unit'] );

    let fontSize = get( dashboardElement, ['style','fontSize'], 'default' );
    fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

    return <View style={ {
        minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        ...style,
    } }>
        { currentMapEvent && currentMapEvent?.center && <Text style={ {
            fontSize,
        } }>{ formatcoords( currentMapEvent.center).format( get( {
            // https://www.npmjs.com/package/formatcoords#user-content-formatting
            'dd': 'f',
            'dmm': 'Ff',
            'dms': 'FFf',
        }, unit.key, 'f' ), {
            decimalPlaces: unit.round,
        } ) }</Text>  }
    </View>;
};

export default {
    key: 'centerCoordinates',
    label: 'centerCoordinates',
    DisplayComponent,
    ControlComponent,
    hasStyleControl: true,
    defaultMinWidth: 200,
    responseInclude: { center: 2 },
};
