/**
 * External dependencies
 */
import { FC, Fragment, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { NumericMultiRowControl } from '../../../../../../components/generic/controls/NumericRowControlsOLD';
import { NumericRowControl } from '../../../../../../components/generic/controls/NumericRowControlsNew';
import HgtSourceRowControl from '../../../../../../components/generic/controls/HgtSourceRowControl';
import { getHillshadingCacheDirChild } from '../../../utils';
import CacheControl from './CacheControl';
import { defaults } from '../../../../../../constants';
import { LayerConfigOptionsHillshading, LayerConfig } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { setLayerTemp } from '../../../baseMapSlice';
import { selectLayerTemp } from '../../../selectors';
import HillshadingAlgorithmControl from './HillshadingAlgorithmControl';

const LayerControlHillshading: FC<{}> = () => {
	const dispatch = useAppDispatch();

	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsHillshading>;

	const setOptions = useCallback((newOptions: LayerConfigOptionsHillshading) => {
		dispatch(
			setLayerTemp(
				(layerTemp) =>
					layerTemp &&
					({
						...layerTemp,
						options: newOptions,
					} as LayerConfig)
			)
		);
	}, []);

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	return (
		<Fragment>
			<HgtSourceRowControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				optKey={'hgtDirPath'}
				dirs={get(appDirs, 'dem', [])}
			/>

			<HillshadingAlgorithmControl />

			<NumericMultiRowControl
				label={t('enabled')}
				optKeys={['enabledZoomMin', 'enabledZoomMax']}
				optLabels={['min', 'max']}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={(val) => val >= 0 && val <= 20}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericMultiRowControl
				label={'Zoom'}
				optKeys={['zoomMin', 'zoomMax']}
				optLabels={['min', 'max']}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={(val) => val >= 0 && val <= 20}
				Info={t('baseMap.hint.zoom') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>

			<NumericRowControl
				label={t('baseMap.shadingOptions.magnitude.label')}
				value={layerTemp?.options?.magnitude ?? 0}
				onUpdate={(newValue) =>
					setOptions({
						...(layerTemp?.options ?? {}),
						magnitude: newValue,
					})
				}
				validate={(val) => val >= 0 && val <= 1000}
				Info={t('baseMap.shadingOptions.magnitude.hint')}
			/>

			<CacheControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				baseDefault={defaults.layerConfigOptions.hillshading.cacheDirBase as string}
				cacheDirChild={getHillshadingCacheDirChild(layerTemp?.options ?? {})}
			/>
		</Fragment>
	);
};

export default LayerControlHillshading;
