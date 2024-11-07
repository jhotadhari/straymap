import { ReactElement } from "react";
import { Style as ListStyle } from "react-native-paper/lib/typescript/components/List/utils";
import { MD3Theme } from 'react-native-paper/lib/typescript/types';

export type AbsPath = `/${string}`;

export type AbsPathsMap = { [value: string]: AbsPath[] };

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
	} ) => React.ReactNode );
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