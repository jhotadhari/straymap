/**
 * Internal dependencies
 */
import { RootState } from "../../store";

export const selectInitialized = (state: RootState) =>
	state.baseMap.initialized;

export const selectLayers = ( state: RootState ) =>
	state.baseMap.layers;

export const selectMapsforgeProfiles = ( state: RootState ) =>
	state.baseMap.mapsforgeProfiles;

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
