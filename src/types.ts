
/**
 * External dependencies
 */
import { ReactElement, ReactNode } from "react";
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";
import { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { GetTrackParams } from "react-native-brouter";

/**
 * react-native-mapsforge-vtm dependencies
 */
import {
	LayerMBTilesBitmapProps,
	LayerBitmapTileProps,
	LayerMapsforgeProps,
	LayerHillshadingProps,
	MapContainerProps,
	Location,
} from 'react-native-mapsforge-vtm';

export interface SliceSettingsBase {
	initialized: boolean;
}

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

export type RoutingProfile = {
	fast: GetTrackParams['fast'],
	v: GetTrackParams['v'],
};

export type RoutingSegment = {
	key: string;
	fromKey: string;
	toKey: string;
	positions?: Location[];
	isFetching?: boolean;
	errorMsg?: string;
	profile: RoutingProfile;
	coordinatesSimplified?: LocationExtended[],
};

export type RoutingTriggeredSegment = {
	index: number;
	nearestPoint: Location;
};

export type NearestSimplifiedCoord = {
	segmentIndex: number;
	featureIndex: number;
	distanceToPoint: number;
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

export type RoutingStats = {
	up: number;
	down: number;
	distance: number;
}