/**
 * react-native-mapsforge-vtm dependencies
 */
import { EnhancedStore } from '@reduxjs/toolkit';
import { SQLiteTable, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core';
import { Location } from 'react-native-mapsforge-vtm';

// source: https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type#answer-51399781
export type ArrayElement<ArrayType extends readonly unknown[]> =
	ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

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

export type NumType = 'int' | 'float';

export interface AppFeature {
	// Used by useSettingsInitialized.
	selectInitialized: (state: any) => boolean;
	// Used by i18n to build resources.
	translation: { [lang: string]: any };
	// If AppFeature does not expose a initializeFromStorage function, it has to be called manually.
	initializeFromStorage?: (store: EnhancedStore) => void | Promise<boolean>;

	// The schema files have to be in a schema subfolder in order to drizzle-kit can find them. See glob in drizzle.config.ts
	schema?: { [table: string]: SQLiteTableWithColumns<any> }; // ??? any
}
