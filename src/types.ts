/**
 * react-native-mapsforge-vtm dependencies
 */
import { Location } from 'react-native-mapsforge-vtm';

export interface SliceSettingsBase {
	initialized: boolean;
}

export type InitialPosition = {
	center: Location;
	zoomLevel: number;
};

export type BottomBarHeight = { [value: string]: number };

export interface OptionBase {
	key: string;
	label: string;
}