
/**
 * External dependencies
 */
import {
	FC,
	useContext,
} from 'react';
import {
	useWindowDimensions,
	ScrollView,
} from 'react-native';
import {
	useTheme,
} from 'react-native-paper';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import MapsControl from './MapsControl';


const SettingsMaps : FC = () => {

	const theme = useTheme();

	const { width } = useWindowDimensions();

    const {
        mapHeight,
    } = useContext( AppContext )

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

        <MapsControl/>


	</ScrollView>;
};



export default SettingsMaps;