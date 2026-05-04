/**
 * Internal dependencies
 */
import { RootState } from "../../store";

type OptionsWithTemp = {
	temp?: boolean;
};

export const selectInitialized = (state: RootState) =>
	state.baseMap.initialized;

export const selectLayers = ( state: RootState, options?: OptionsWithTemp ) =>
	options && options?.temp && state.baseMap?.layersTemp
		? state.baseMap.layersTemp
		: state.baseMap.layers;

export const selectMapsforgeProfiles = ( state: RootState, options?: OptionsWithTemp ) =>
	options && options?.temp && state.baseMap?.mapsforgeProfilesTemp
		? state.baseMap.mapsforgeProfilesTemp
		: state.baseMap.mapsforgeProfiles;

export const selectHgtDirPath = ( state: RootState ) =>
	state.baseMap.hgtDirPath;

export const selectHgtReadFileRate = ( state: RootState ) =>
	state.baseMap.hgtReadFileRate;

export const selectHgtInterpolation = ( state: RootState ) =>
	state.baseMap.hgtInterpolation;

export const selectHgtFileInfoPurgeThreshold = ( state: RootState ) =>
	state.baseMap.hgtFileInfoPurgeThreshold;

export const selectMapsforgeGeneral = ( state: RootState ) =>
	state.baseMap.mapsforgeGeneral;
