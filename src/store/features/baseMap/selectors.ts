/**
 * Internal dependencies
 */
import createAppSelector from '../../createAppSelector';
import { RootState } from '../../store';
import { LayerConfig } from './types';
import { fillLayerConfigOptionsWithDefaults } from './utils';

type OptionsWithTemp = {
	temp?: boolean;
};

export const selectInitialized = (state: RootState) => state.baseMap.initialized;

export const selectMapsforgeProfiles = (state: RootState, options?: OptionsWithTemp) =>
	options && options?.temp && state.baseMap?.mapsforgeProfilesTemp
		? state.baseMap.mapsforgeProfilesTemp
		: state.baseMap.mapsforgeProfiles;

export const selectMapsforgeProfileTemp = (state: RootState) => state.baseMap.mapsforgeProfileTemp;

export const selectHgtDirPath = (state: RootState) => state.baseMap.hgtDirPath;

export const selectHgtReadFileRate = (state: RootState) => state.baseMap.hgtReadFileRate;

export const selectHgtInterpolation = (state: RootState) => state.baseMap.hgtInterpolation;

export const selectHgtFileInfoPurgeThreshold = (state: RootState) =>
	state.baseMap.hgtFileInfoPurgeThreshold;

export const selectMapsforgeGeneral = (state: RootState) => state.baseMap.mapsforgeGeneral;

export const selectRenderStylesCache = (state: RootState) => state.baseMap.renderStylesCache;

export const selectLayerInfos = (state: RootState) => state.baseMap.layerInfos;

export const selectLayers = createAppSelector(
	(state: RootState) => state.baseMap.layers,
	(state: RootState) => state.baseMap.layersTemp,
	(_state: RootState, options?: OptionsWithTemp) => !!options?.temp,
	(layers, layersTemp, temp: boolean): LayerConfig[] => {
		return (temp && layersTemp ? layersTemp : layers).map((layer) => ({
			...layer,
			options: fillLayerConfigOptionsWithDefaults(layer.type, layer.options),
		}));
	}
);

export const selectLayerTemp = createAppSelector(
	(state: RootState) => state.baseMap.layerTemp,
	(state: RootState) => state.baseMap.layerTemp?.type,
	(layer, type): undefined | LayerConfig => {
		if (!layer) {
			return layer;
		}
		return {
			...layer,
			options: fillLayerConfigOptionsWithDefaults(type ?? null, layer.options),
		};
	}
);
