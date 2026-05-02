/**
 * External dependencies
 */
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import rnUuid from 'react-native-uuid';
import { LayerHillshadingProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
*/
import { SliceSettingsBase } from '../../../types';
import { LayerConfig, MapsforgeGeneral, MapsforgeProfile } from './types';

export interface BaseMapSettings {
	layers: LayerConfig[];
	mapsforgeProfiles: MapsforgeProfile[];
	hgtDirPath?: LayerHillshadingProps['hgtDirPath'];
	hgtReadFileRate: number;
	hgtInterpolation: boolean;
	hgtFileInfoPurgeThreshold: number;
	mapsforgeGeneral: MapsforgeGeneral;
}

export interface BaseMapState extends SliceSettingsBase, BaseMapSettings {}

export const initialSettings : BaseMapSettings = {
	layers: [
		{
			key: rnUuid.v4(),
			name: 'OpenStreetMap',
			type: 'online-raster-xyz',
			visible: true,
			options: {
				cacheSize: 128,
				cacheDirBase: 'internal',
				enabledZoomMax: 20,
				enabledZoomMin: 1,
				url: 'https://tile.openstreetmap.org/{Z}/{X}/{Y}.png',
				zoomMax: 20,
				zoomMin: 1,
			},
		},
	],
	mapsforgeProfiles: [
		{
			key: rnUuid.v4(),
			name: 'Default',
			renderOverlays: [],
			renderStyle: null,
			theme: 'DEFAULT',
		},
	],
	hgtDirPath: undefined,
	hgtReadFileRate: 100,
	hgtInterpolation:  true,
	hgtFileInfoPurgeThreshold: 3,
	mapsforgeGeneral: {
		lineScale: 1.6,
		symbolScale: 1,
		textScale: 1.4,
	},
};

const initialState: BaseMapState = {
	initialized: false,
	...initialSettings,
};

// Slices contain Redux reducer logic for updating state, and
// generate actions that can be dispatched to trigger those updates.
export const baseMapSlice = createSlice({
	name: 'baseMap',
	initialState,
	reducers: {
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.initialized = action.payload;
		},
		setLayers: (state, action: PayloadAction<BaseMapSettings['layers']>) => {
			state.layers = action.payload;
		},
		setMapsforgeProfiles: (state, action: PayloadAction<BaseMapSettings['mapsforgeProfiles']>) => {
			state.mapsforgeProfiles = action.payload;
		},
		setHgtDirPath: (state, action: PayloadAction<BaseMapSettings['hgtDirPath']>) => {
			state.hgtDirPath = action.payload;
		},
		setHgtReadFileRate: (state, action: PayloadAction<BaseMapSettings['hgtReadFileRate']>) => {
			state.hgtReadFileRate = action.payload;
		},
		setHgtInterpolation: (state, action: PayloadAction<BaseMapSettings['hgtInterpolation']>) => {
			state.hgtInterpolation = action.payload;
		},
		setHgtFileInfoPurgeThreshold: (state, action: PayloadAction<BaseMapSettings['hgtFileInfoPurgeThreshold']>) => {
			state.hgtFileInfoPurgeThreshold = action.payload;
		},
		setMapsforgeGeneral: (state, action: PayloadAction<BaseMapSettings['mapsforgeGeneral']>) => {
			state.mapsforgeGeneral = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setLayers,
	setMapsforgeProfiles,
	setHgtDirPath,
	setHgtReadFileRate,
	setHgtInterpolation,
	setHgtFileInfoPurgeThreshold,
	setMapsforgeGeneral,
} = baseMapSlice.actions;

// Export the slice reducer for use in the store configuration
export default baseMapSlice.reducer;
