/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import {
	NumericRowControl,
	NumericMultiRowControl,
} from '../../../../../../components/generic/controls/NumericRowControls';
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
		<View>
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
				validate={(val) => val >= 0}
				Info={t('hint.maps.enabled') + '\n\n' + t('hint.maps.zoomGeneralInfo')}
			/>

			<NumericMultiRowControl
				label={'Zoom'}
				optKeys={['zoomMin', 'zoomMax']}
				optLabels={['min', 'max']}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={(val) => val >= 0}
				Info={t('hint.maps.zoom') + '\n\n' + t('hint.maps.zoomGeneralInfo')}
			/>

			<NumericRowControl
				label={t('shadingOptions.magnitude.label')}
				optKey={'magnitude'}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={(val) => val > 0}
				Info={t('shadingOptions.magnitude.hint')}
			/>

			<CacheControl
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				baseDefault={defaults.layerConfigOptions.hillshading.cacheDirBase as string}
				cacheDirChild={getHillshadingCacheDirChild(layerTemp?.options ?? {})}
			/>
		</View>
	);
};

export default LayerControlHillshading;
