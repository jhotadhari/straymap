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
import { LayerConfig, MapsforgeGeneral, MapsforgeProfile, RenderStylesCache } from './types';
import { getLayerType, getNewProfile } from './utils';

export interface BaseMapSettings {
	layers: LayerConfig[];
	mapsforgeProfiles: MapsforgeProfile[];
	hgtDirPath?: LayerHillshadingProps['hgtDirPath'];
	hgtReadFileRate: number;
	hgtInterpolation: boolean;
	hgtFileInfoPurgeThreshold: number;
	mapsforgeGeneral: MapsforgeGeneral;
	renderStylesCache: RenderStylesCache;
}

export interface BaseMapState extends SliceSettingsBase, BaseMapSettings {
	layersTemp?: LayerConfig[];
	layerTemp?: LayerConfig;
	mapsforgeProfilesTemp?: MapsforgeProfile[];
	mapsforgeProfileTemp?: MapsforgeProfile;
}

export const initialSettings: BaseMapSettings = {
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
	hgtInterpolation: true,
	hgtFileInfoPurgeThreshold: 3,
	mapsforgeGeneral: {
		lineScale: 1.6,
		symbolScale: 1,
		textScale: 1.4,
	},
	renderStylesCache: {
		optionsMap: {},
		defaultsMap: {},
	},
};

const initialState: BaseMapState = {
	initialized: false,
	layersTemp: undefined,
	layerTemp: undefined,
	mapsforgeProfilesTemp: undefined,
	mapsforgeProfileTemp: undefined,
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
		setLayers: (
			state,
			action: PayloadAction<{
				layers?: BaseMapSettings['layers'];
				temp?: boolean;
			}>
		) => {
			if (action.payload?.temp) {
				if (action.payload?.layers) {
					state.layersTemp = action.payload?.layers;
				}
			} else {
				if (action.payload?.layers) {
					state.layers = action.payload?.layers;
					state.layersTemp = undefined;
				} else if (state.layersTemp) {
					state.layers = state.layersTemp;
					state.layersTemp = undefined;
				}
			}
		},
		setLayerTemp: (state, action: PayloadAction<BaseMapState['layerTemp']>) => {
			state.layerTemp = action.payload;
			if (!action.payload || !action.payload.type) {
				return;
			}
			const newLayer = action.payload;
			let newLayers = state.layersTemp ?? state.layers;
			const itemIndex = newLayers.findIndex((item) => item.key === newLayer.key);
			if (-1 !== itemIndex) {
				newLayers[itemIndex] = newLayer;
				state.layersTemp = newLayers;
			} else {
				let insertIndex = 0;
				if ('base' === getLayerType(newLayer)) {
					const indexFirstBase = newLayers.findIndex(
						(layer) => 'base' === getLayerType(layer)
					);
					insertIndex = indexFirstBase !== -1 ? indexFirstBase : insertIndex;
				}
				newLayers.splice(insertIndex, 0, newLayer);
				state.layersTemp = newLayers;
			}
		},
		setMapsforgeProfiles: (
			state,
			action: PayloadAction<{
				mapsforgeProfiles?: BaseMapSettings['mapsforgeProfiles'];
				temp?: boolean;
			}>
		) => {
			if (action.payload?.temp) {
				if (
					action.payload?.mapsforgeProfiles &&
					Array.isArray(action.payload?.mapsforgeProfiles) &&
					action.payload?.mapsforgeProfiles.length
				) {
					state.mapsforgeProfilesTemp = action.payload.mapsforgeProfiles;
				}
			} else {
				if (
					action.payload?.mapsforgeProfiles &&
					Array.isArray(action.payload?.mapsforgeProfiles) &&
					action.payload?.mapsforgeProfiles.length
				) {
					state.mapsforgeProfiles = action.payload.mapsforgeProfiles;
					state.mapsforgeProfilesTemp = undefined;
				} else if (
					state?.mapsforgeProfilesTemp &&
					Array.isArray(state?.mapsforgeProfilesTemp) &&
					state?.mapsforgeProfilesTemp.length
				) {
					state.mapsforgeProfiles = state.mapsforgeProfilesTemp;
					state.mapsforgeProfilesTemp = undefined;
				} else if (!state.mapsforgeProfiles.length) {
					state.mapsforgeProfiles = [
						{
							...getNewProfile(),
							name: 'default',
						},
					];
					state.mapsforgeProfilesTemp = undefined;
				}
			}
		},
		setMapsforgeProfileTemp: (
			state,
			action: PayloadAction<BaseMapState['mapsforgeProfileTemp']>
		) => {
			state.mapsforgeProfileTemp = action.payload;
		},
		setHgtDirPath: (state, action: PayloadAction<BaseMapSettings['hgtDirPath']>) => {
			state.hgtDirPath = action.payload;
		},
		setHgtReadFileRate: (state, action: PayloadAction<BaseMapSettings['hgtReadFileRate']>) => {
			state.hgtReadFileRate = action.payload;
		},
		setHgtInterpolation: (
			state,
			action: PayloadAction<BaseMapSettings['hgtInterpolation']>
		) => {
			state.hgtInterpolation = action.payload;
		},
		setHgtFileInfoPurgeThreshold: (
			state,
			action: PayloadAction<BaseMapSettings['hgtFileInfoPurgeThreshold']>
		) => {
			state.hgtFileInfoPurgeThreshold = action.payload;
		},
		setMapsforgeGeneral: (
			state,
			action: PayloadAction<BaseMapSettings['mapsforgeGeneral']>
		) => {
			state.mapsforgeGeneral = action.payload;
		},
		setRenderStylesCache: (
			state,
			action: PayloadAction<BaseMapSettings['renderStylesCache']>
		) => {
			state.renderStylesCache = action.payload;
		},
	},
});

// Export the generated action creators for use in components.
export const {
	setInitialized,
	setLayers,
	setLayerTemp,
	setMapsforgeProfiles,
	setMapsforgeProfileTemp,
	setHgtDirPath,
	setHgtReadFileRate,
	setHgtInterpolation,
	setHgtFileInfoPurgeThreshold,
	setMapsforgeGeneral,
	setRenderStylesCache,
} = baseMapSlice.actions;

// Export the slice reducer for use in the store configuration
export default baseMapSlice.reducer;
