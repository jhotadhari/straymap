/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import HgtSourceRowControl from '../../../../general/components/controls/HgtSourceRowControl';
import { getHillshadingCacheDirChild } from '../../../utils';
import { labelFromAppPath } from '../../../../../lib/utils';
import CacheControl from './CacheControl';
import { defaults } from '../../../defaults';
import { LayerConfig, LayerConfigOptionsHillshading } from '../../../types';
import { useLayerTemp } from '../../../hooks/useLayerTemp';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppSelector } from '../../../../../store/hooks';
import NumericRowControlMulti from '../../../../../components/generic/controls/NumericRowControlMulti';

const validateZoom = (val: number) => val >= 0;
const validateMagnitude = (val: number) => val >= 0 && val <= 1000;
const validateMaxSlope = (val: number) => val > 0 && val < 100;
const validateMinSlope = (val: number) => val >= 0 && val < 100;
const validateUnitInterval = (val: number) => val >= 0 && val <= 1;
const zoomOptLabels = ['min', 'max'];

const LayerControlHillshading: FC<{}> = () => {
	const { layerTemp, setOptions } = useLayerTemp<LayerConfigOptionsHillshading>();

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const hsDefaults = defaults.layerConfigOptions.hillshading;

	const enabledZoomValues = useMemo(
		() => [layerTemp?.options?.enabledZoomMin ?? 0, layerTemp?.options?.enabledZoomMax ?? 0],
		[layerTemp?.options?.enabledZoomMin, layerTemp?.options?.enabledZoomMax]
	);

	const zoomValues = useMemo(
		() => [layerTemp?.options?.zoomMin ?? 0, layerTemp?.options?.zoomMax ?? 0],
		[layerTemp?.options?.zoomMin, layerTemp?.options?.zoomMax]
	);

	const handleEnabledZoomUpdate = useCallback(
		(newValues: number[]) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				['enabledZoomMin']: newValues[0],
				['enabledZoomMax']: newValues[1],
			}),
		[layerTemp?.options, setOptions]
	);

	const handleZoomUpdate = useCallback(
		(newValues: number[]) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				['zoomMin']: newValues[0],
				['zoomMax']: newValues[1],
			}),
		[layerTemp?.options, setOptions]
	);

	const handleMagnitudeUpdate = useCallback(
		(newValue: number) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				magnitude: newValue,
			}),
		[layerTemp?.options, setOptions]
	);

	const handleMaxSlopeUpdate = useCallback(
		(newValue: number) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				maxSlope: newValue,
			}),
		[layerTemp?.options, setOptions]
	);

	const handleMinSlopeUpdate = useCallback(
		(newValue: number) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				minSlope: newValue,
			}),
		[layerTemp?.options, setOptions]
	);

	const handleAsymmetryFactorUpdate = useCallback(
		(newValue: number) =>
			setOptions({
				...(layerTemp?.options ?? {}),
				asymmetryFactor: newValue,
			}),
		[layerTemp?.options, setOptions]
	);

	return (
		<Fragment>
			<HgtSourceRowControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				optKey={'hgtDirPath'}
				dirs={get(appDirs, 'dem', [])}
				fallbackAppHgt={true}
				modalHeader={t('baseMap.selectDemDir')}
			/>

			<NumericRowControlMulti
				label={t('enabled')}
				optLabels={zoomOptLabels}
				saveOnType={false}
				values={enabledZoomValues}
				onUpdate={handleEnabledZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControlMulti
				label={'Zoom'}
				optLabels={zoomOptLabels}
				saveOnType={false}
				values={zoomValues}
				onUpdate={handleZoomUpdate}
				validate={validateZoom}
				Info={t('baseMap.hint.zoom') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControl
				label={t('baseMap.shadingOptions.magnitude.label')}
				value={layerTemp?.options?.magnitude ?? hsDefaults.magnitude!}
				onUpdate={handleMagnitudeUpdate}
				validate={validateMagnitude}
				Info={t('baseMap.shadingOptions.magnitude.hint')}
			/>

			<NumericRowControl
				label={t('baseMap.shadingOptions.maxSlope.label')}
				value={layerTemp?.options?.maxSlope ?? hsDefaults.maxSlope!}
				onUpdate={handleMaxSlopeUpdate}
				validate={validateMaxSlope}
				numType="float"
				Info={t('baseMap.shadingOptions.maxSlope.hint')}
			/>

			<NumericRowControl
				label={t('baseMap.shadingOptions.minSlope.label')}
				value={layerTemp?.options?.minSlope ?? hsDefaults.minSlope!}
				onUpdate={handleMinSlopeUpdate}
				validate={validateMinSlope}
				numType="float"
				Info={t('baseMap.shadingOptions.minSlope.hint')}
			/>

			<NumericRowControl
				label={t('baseMap.shadingOptions.asymmetryFactor.label')}
				value={layerTemp?.options?.asymmetryFactor ?? hsDefaults.asymmetryFactor!}
				onUpdate={handleAsymmetryFactorUpdate}
				validate={validateUnitInterval}
				numType="float"
				Info={t('baseMap.shadingOptions.asymmetryFactor.hint')}
			/>

			<CacheControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				baseDefault={defaults.layerConfigOptions.hillshading.cacheDirBase as string}
				cacheDirChild={getHillshadingCacheDirChild(layerTemp?.options ?? {})}
				treatAsBoolean={999}
			/>
		</Fragment>
	);
};

// Derive a raw label from the hillshading layer's DEM source.
// Returns a path-derived label (e.g. "media", "sdcard data") or undefined.
export const getPlaceholderLabel = (layer: LayerConfig, appHgtDirPath?: string) => {
	const path = (layer.options as LayerConfigOptionsHillshading)?.hgtDirPath ?? appHgtDirPath;
	return path ? labelFromAppPath(path) : undefined;
};

export default LayerControlHillshading;
