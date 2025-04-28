
/**
 * External dependencies
 */
import { ReactElement, ReactNode } from "react";
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	LayerMBTilesBitmapProps,
	LayerBitmapTileProps,
	LayerMapsforgeProps,
	LayerHillshadingProps,
	MapEventResponse,
	MapContainerProps,
	Location,
} from 'react-native-mapsforge-vtm';
import { ViewStyle } from "react-native";
import { ComposedGesture, GestureType } from "react-native-gesture-handler";


export type AbsPath = `/${string}`;

export type AbsPathsMap = { [value: string]: AbsPath[] };

export type LayerInfo = {
	attribution?: string | null;
	description?: string | null;
	comment?: string | null;
	createdBy?: string | null;
};

export type InitialPosition = {
	center: Location,
	zoomLevel: number,
};

export type LayerInfos = { [value: string]: LayerInfo };

export type BottomBarHeight = { [value: string]: number };

export interface MenuItem {
	key: string;
	leadingIcon: string;
	label: string;
	hierarchyIncludeParents?: boolean;
	SubActivity?: ReactElement;
	children?: MenuItem[];
};

export interface SettingsItem {
	key: string;
	left?: ( ( props: {
		color: string;
		style: ListStyle;
	} ) => ReactNode );
	label: string;
	description?: string;
	SubActivity?: ReactElement;
	children?: SettingsItem[];
};

export interface ThemePropExtended extends MD3Theme {
    label?: string;
};

export interface OptionBase {
	key: string;
	label: string;
};

export interface ThemeOption extends OptionBase {
	value: ThemePropExtended;
};

export type HierarchyItem = MenuItem | SettingsItem;

export type LayerType = 'base' | 'overlay';

export interface LayerOption extends OptionBase {
    type: LayerType;
};

export interface LayerConfigOptionsOnlineRasterXYZ {
	url?: LayerBitmapTileProps['url'];
	alpha?: LayerBitmapTileProps['alpha'];
	cacheSize?: LayerBitmapTileProps['cacheSize'];
	cacheDirBase?: 'internal' | LayerBitmapTileProps['cacheDirBase'];
	enabledZoomMin?: LayerBitmapTileProps['enabledZoomMin'],
	enabledZoomMax?: LayerBitmapTileProps['enabledZoomMax'],
	zoomMin?: LayerBitmapTileProps['zoomMin'],
	zoomMax?: LayerBitmapTileProps['zoomMax'],
};

export interface LayerConfigOptionsMapsforge {
	mapFile?: LayerMapsforgeProps['mapFile'];
	enabledZoomMin?: LayerMBTilesBitmapProps['enabledZoomMin'];
	enabledZoomMax?: LayerMBTilesBitmapProps['enabledZoomMax'];
	profile?: string;
};

export interface LayerConfigOptionsRasterMBtiles {
	mapFile?: LayerMBTilesBitmapProps['mapFile'];
	enabledZoomMin?: LayerMBTilesBitmapProps['enabledZoomMin'];
	enabledZoomMax?: LayerMBTilesBitmapProps['enabledZoomMax'];
};

export interface LayerConfigOptionsHillshading {
	hgtDirPath?: LayerHillshadingProps['hgtDirPath'];
	enabledZoomMin?: LayerHillshadingProps['enabledZoomMin'];
	enabledZoomMax?: LayerHillshadingProps['enabledZoomMax'];
	zoomMin?: LayerHillshadingProps['zoomMin'];
	zoomMax?: LayerHillshadingProps['zoomMax'];
	shadingAlgorithm?: LayerHillshadingProps['shadingAlgorithm'];
	shadingAlgorithmOptions?: LayerHillshadingProps['shadingAlgorithmOptions'];
	magnitude?: LayerHillshadingProps['magnitude'];
	cacheSize?: LayerHillshadingProps['cacheSize'];
	cacheDirBase?: 'internal' | LayerBitmapTileProps['cacheDirBase'];
};

export type LayerConfigOptionsAny = LayerConfigOptionsOnlineRasterXYZ
	| LayerConfigOptionsMapsforge
	| LayerConfigOptionsRasterMBtiles
	| LayerConfigOptionsHillshading;

export type LayerConfig = {
    key: string;
    name: string;
    type: null | string;	// 'online-raster-xyz' | 'mapsforge' | 'raster-MBtiles' | 'hillshading';
    visible: boolean;
	options: LayerConfigOptionsAny;
};

export type MapsforgeProfile = {
    key: string;
    name: string;
    theme: string; // It is AbsPath or built-in
    renderStyle: null | string;
    renderOverlays: string[];
	hasBuildings?: boolean;
	hasLabels?: boolean;
};

export type HgtDirPath = LayerConfigOptionsHillshading['hgtDirPath'] | MapContainerProps['hgtDirPath'];

export type UiState = {
	mapLayersExpanded: Boolean;
	mapsforgeProfilesExpanded: Boolean;
	cacheManagerExpanded: Boolean;
};

export type MapsforgeGeneral = {
	textScale: number;
	lineScale: number;
	symbolScale: number;
};

export type MapSettings = {
	layers: LayerConfig[];
	mapsforgeProfiles: MapsforgeProfile[];
	hgtDirPath: MapContainerProps['hgtDirPath'];
	hgtReadFileRate: MapContainerProps['hgtReadFileRate'];
	hgtInterpolation: MapContainerProps['hgtInterpolation'];
	hgtFileInfoPurgeThreshold: MapContainerProps['hgtFileInfoPurgeThreshold'];
	mapsforgeGeneral: MapsforgeGeneral;
};

export type UpdateResults = {
	[value: string]: 	// the version updating from
	{
		state: 'failed' | 'updating' | 'success';
		msg?: string;
	}
};

export type UpdaterSettings = {
	installedVersion: string;
}

export type CursorConfig = {
	iconSource: string;
	size: number;
	color: string;
};

export type AppearanceSettings = {
	cursor: CursorConfig;
};

export type HardwareKeyActionConf = {
	keyCodeString: string;
	actionKey: string;
};

export type DashboardElementStyle = {
	fontSize?: 'default' | number;
	minWidth?: number;
};

export type DashboardElementConf = {
	key: string;
	type: string | null;
	options?: object;
	style?: DashboardElementStyle;
};

export type UnitPref = {
	unit: string;
	round: number;
};

export type DashboardStyle = {
	align: string;
	fontSize: number;
};

export type GeneralSettings = {
	hardwareKeys: HardwareKeyActionConf[];
	dashboardElements: {
		elements: DashboardElementConf[];
		style: DashboardStyle;
	};
	unitPrefs: { [value: string]: UnitPref };
	mapEventRate: MapContainerProps['mapEventRate'];
};

export type DashboardDisplayComponentProps = {
	dashboardElement: DashboardElementConf;
	currentMapEvent: MapEventResponse;
	style?: ViewStyle;
	unitPrefs: { [value: string]: UnitPref };
	dashboardStyle: DashboardStyle;
}

export type RoutingPoint = {
	key: string;
	location: Location;
};

export interface LocationExtended extends Location {
	lng: number;
	lat: number;
	alt?: number;
	distance?: number;
	slope?: number;
	time?: number;
};

export type RoutingSegment = {
	key: string;
	fromKey: string;
	toKey: string;
	positions?: Location[];
	isFetching?: boolean;
	errorMsg?: string;

	coordinatesSimplified?: LocationExtended[],
};

export type RoutingTriggeredSegment = {
	index: number;
	nearestPoint: Location;
};

export type DrawerState = {
	showInner: boolean;
	gesture: ComposedGesture | GestureType;
	animatedStyles: any;
	side: string;
	drawerWidth: number;
	outerWidth: number;
	expand: ( expanded: boolean ) => void;
	getIsFullyCollapsed: () => boolean;
};