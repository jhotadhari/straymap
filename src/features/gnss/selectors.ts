/**
 * Internal dependencies
 */
import { RootState } from '../../store/store';

export const selectInitialized = (state: RootState) => state.gnss.initialized;

export const selectIsActive = (state: RootState) => state.gnss.isActive;

export const selectGnssPosition = (state: RootState) => state.gnss.position;

export const selectGnssHeading = (state: RootState) => state.gnss.heading;

export const selectDeviceAzimuth = (state: RootState) => state.gnss.deviceAzimuth;

export const selectIsCenterActive = (state: RootState) => state.gnss.isCenterActive;

export const selectRecenterDelaySec = (state: RootState) => state.gnss.recenterDelaySec;

export const selectMarkerIconSource = (state: RootState) => state.gnss.markerIconSource;

export const selectMarkerSize = (state: RootState) => state.gnss.markerSize;

export const selectMarkerColor = (state: RootState) => state.gnss.markerColor;

export const selectMarkerDirection = (state: RootState) => state.gnss.markerDirection;

export const selectAccuracyCircleThresholdMeters = (state: RootState) =>
	state.gnss.accuracyCircleThresholdMeters;

export const selectShowMeasurementLabel = (state: RootState) => state.gnss.showMeasurementLabel;
