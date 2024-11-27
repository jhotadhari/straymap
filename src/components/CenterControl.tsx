
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
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import ColorPicker from 'react-native-wheel-color-picker'

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import InfoRowControl from './InfoRowControl';
import { AppearanceSettings, CurserConfig } from '../types';
import ListItemModalControl from './ListItemModalControl';
import { NumericRowControl } from './NumericRowControls';
import FileSourceRowControl from './FileSourceRowControl';
import { CenterInner } from './Center';

const ColorRowControl = ( {
	curserConfig,
	setCurserConfig,
} : {
	curserConfig: CurserConfig;
	setCurserConfig?: Dispatch<SetStateAction<CurserConfig | undefined>>;
} ) => {
	return  <InfoRowControl label={ 'color' } >
		<ColorPicker
			color= { curserConfig?.color }
			onColorChange={ ( newColor: string ) => {
				setCurserConfig && setCurserConfig( {
					...curserConfig,
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

	const [curserConfig,setCurserConfig] = useState<CurserConfig | undefined >( get( appearanceSettings, 'curser', undefined ) );
	const curserConfigRef = useRef( curserConfig );
    useEffect( () => {
        curserConfigRef.current = curserConfig;
    }, [curserConfig] );

    const saveCurser = () => appearanceSettings && setAppearanceSettings && setAppearanceSettings( ( appearanceSettings: AppearanceSettings ) => ( {
        ...appearanceSettings,
        ...( curserConfigRef.current && { curser: curserConfigRef.current } ),
    } ) );
    useEffect( () => saveCurser, [] );    // Save on unmount.

	return <ListItemModalControl
		anchorLabel={ 'curser' }
		anchorIcon={ ( { color, style } ) => <View style={ style }>

			{ ! curserConfig?.iconSource &&  <Icon
				source="target"
				color={ color }
				size={ 25 }
			/> }

			{ curserConfig?.iconSource && <CenterInner curser={ {
				...curserConfig,
				size: 25,
				color: theme.colors.onBackground,
			} } /> }

		</View> }
		header={ 'Curser???' }
		hasHeaderBackPress={ true }
	>

        <FileSourceRowControl
            header={ t( 'selectFile' ) }
            label={ t( 'file' ) }
            options={ curserConfig as object }
            optionsKey={ 'iconSource' }
            onSelect={ selectedOpt => {
				setCurserConfig( {
					...( curserConfig as CurserConfig ),
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
            filePattern={ /.*\.(svg|png)$/ }
            dirs={ appDirs ? appDirs.curser : [] }
            Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
            filesHeading={ 'image (svg|png) files in' }         // ??? translate
            noFilesHeading={ 'No image (svg|png) files in' }    // ??? translate
            hasCustom={ true }
        />

        <NumericRowControl
            label={ t( 'size' ) }
            optKey={ 'size' }
            options={ curserConfig as object }
            setOptions={ setCurserConfig }
            validate={ val => val >= 0 }
            Info={ <Text>{ 'bla bla ??? info text' }</Text> }
        />

		{ curserConfig?.iconSource && ! curserConfig.iconSource.startsWith( '/' ) && ! curserConfig.iconSource.startsWith( 'content://' ) && <ColorRowControl
			curserConfig={ curserConfig }
			setCurserConfig={ setCurserConfig }
		/> }

		<InfoRowControl label={ 'preview' } >
			<CenterInner curser={ curserConfig } />
		</InfoRowControl>

	</ListItemModalControl>;
};

export default CenterControl;