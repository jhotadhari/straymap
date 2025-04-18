
/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
	View,
} from 'react-native';
import {
	Icon,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import ColorPicker from 'react-native-wheel-color-picker'
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import InfoRowControl from './generic/InfoRowControl';
import { AppearanceSettings, CursorConfig } from '../types';
import ListItemModalControl from './generic/ListItemModalControl';
import { NumericRowControl } from './generic/NumericRowControls';
import FileSourceRowControl from './FileSourceRowControl';
import { CenterInner } from './Center';

const ColorRowControl = ( {
	cursorConfig,
	setCursorConfig,
} : {
	cursorConfig: CursorConfig;
	setCursorConfig?: Dispatch<SetStateAction<CursorConfig | undefined>>;
} ) => {

	const { t } = useTranslation();

	return  <InfoRowControl label={ t( 'color' ) } >
		<ColorPicker
			color= { cursorConfig?.color }
			onColorChange={ ( newColor: string ) => {
				setCursorConfig && setCursorConfig( {
					...cursorConfig,
					color: newColor,
				} )
			} }
		/>
	</InfoRowControl>;
};

const CenterControl = () => {

	const theme = useTheme();
	const { t } = useTranslation();

	const {
		appearanceSettings,
		setAppearanceSettings,
		appDirs,
	} = useContext( AppContext );

	const [cursorConfig,setCursorConfig] = useState<CursorConfig | undefined >( get( appearanceSettings, 'cursor', undefined ) );
	const cursorConfigRef = useRef( cursorConfig );
    useEffect( () => {
        cursorConfigRef.current = cursorConfig;
    }, [cursorConfig] );

    const saveCursor = () => appearanceSettings && setAppearanceSettings && setAppearanceSettings( ( appearanceSettings: AppearanceSettings ) => ( {
        ...appearanceSettings,
        ...( cursorConfigRef.current && { cursor: cursorConfigRef.current } ),
    } ) );
    useEffect( () => saveCursor, [] );    // Save on unmount.

	return <ListItemModalControl
		anchorLabel={ 'Cursor' }
		anchorIcon={ ( { color, style } ) => <View style={ style }>

			{ ! cursorConfig?.iconSource &&  <Icon
				source="target"
				color={ color }
				size={ 25 }
			/> }

			{ cursorConfig?.iconSource && <CenterInner cursor={ {
				...cursorConfig,
				size: 25,
				color: theme.colors.onBackground,
			} } /> }

		</View> }
		header={ t( 'cursor' ) }
		hasHeaderBackPress={ true }
	>

        <FileSourceRowControl
            header={ t( 'selectFile' ) }
            label={ t( 'file' ) }
            options={ cursorConfig as object }
            optionsKey={ 'iconSource' }
            onSelect={ selectedOpt => {
				setCursorConfig( {
					...( cursorConfig as CursorConfig ),
					iconSource: selectedOpt,
				} );
			} }
			initialOptsMap={ {
				[ ' ']: [
					{
						key: 'target',
						label: 'target',
					},
					{
						key: 'target-variant',
						label: 'target-variant',
					},
				]
			} }
            extensions={ ['svg','png'] }
            dirs={ appDirs ? appDirs.cursor : [] }
            Info={ t( 'hint.center.file' ) }
            filesHeading={ sprintf( t( 'filesIn' ), '(svg|png)' ) }
            noFilesHeading={ sprintf( t( 'noFilesIn' ), '(svg|png)' ) }
            hasCustom={ true }
        />

        <NumericRowControl
            label={ t( 'size [px]' ) }
            optKey={ 'size' }
            options={ cursorConfig as object }
            setOptions={ setCursorConfig }
            validate={ val => val >= 0 }
        />

		{ cursorConfig?.iconSource && ! cursorConfig.iconSource.startsWith( '/' ) && ! cursorConfig.iconSource.startsWith( 'content://' ) && <ColorRowControl
			cursorConfig={ cursorConfig }
			setCursorConfig={ setCursorConfig }
		/> }

		<InfoRowControl label={ t( 'preview' ) } >
			<CenterInner cursor={ cursorConfig } />
		</InfoRowControl>

	</ListItemModalControl>;
};

export default CenterControl;