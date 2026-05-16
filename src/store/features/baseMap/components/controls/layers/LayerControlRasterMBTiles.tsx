/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { NumericMultiRowControl } from '../../../../../../components/generic/controls/NumericRowControls';
import FileSourceRowControl from '../../../../../../components/generic/controls/FileSourceRowControl';
import HintLink from '../../../../../../components/generic/HintLink';
import { LayerConfig, LayerConfigOptionsRasterMBtiles } from '../../../types';
import { selectAppDirs } from '../../../../dirs/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectLayerTemp } from '../../../selectors';
import { setLayerTemp } from '../../../baseMapSlice';

const extensions = ['mbtiles'];

const MapFileInfo: FC<{}> = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	return (
		<View>
			<Text>{t('baseMap.hint.mbTilesFile')}</Text>
			<Text
				style={{
					marginTop: 20,
					...theme.fonts.bodyLarge,
				}}
			>
				{'Downloads:'}
			</Text>
			<HintLink
				label={t('.baseMap.link.openandromapsDownloadsRaster')}
				url={'https://www.openandromaps.org/en/downloads/general-maps'}
			/>
		</View>
	);
};

const LayerControlRasterMBTiles: FC<{}> = () => {
	const dispatch = useAppDispatch();
	const layerTemp = useAppSelector(selectLayerTemp) as
		| undefined
		| LayerConfig<LayerConfigOptionsRasterMBtiles>;

	const { t } = useTranslation();

	const appDirs = useAppSelector(selectAppDirs);

	const setOptions = useCallback((newOptions: LayerConfigOptionsRasterMBtiles) => {
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

	const handleMapFileChange = useCallback(
		(selectedOpt: LayerConfigOptionsRasterMBtiles['mapFile']) => {
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						layerTemp &&
						({
							...layerTemp,
							options: {
								...layerTemp.options,
								mapFile: selectedOpt,
							},
						} as LayerConfig)
				)
			);
		},
		[]
	);

	const enabledOptions = useMemo(() => {
		const options = [
			{
				key: 'enabledZoomMin',
				label: 'min',
			},
			{
				key: 'enabledZoomMax',
				label: 'max',
			},
		];
		return {
			keys: options.map((opt) => opt.key),
			labels: options.map((opt) => opt.label),
		};
	}, []);

	const validateZoom = useCallback((val: number) => val >= 0, []);

	return (
		<View>
			<FileSourceRowControl
				header={t('baseMap.selectFile')}
				label={t('baseMap.file')}
				options={layerTemp?.options ?? {}}
				optionsKey={'mapFile'}
				onSelect={handleMapFileChange}
				extensions={extensions}
				dirs={appDirs?.mapfiles ?? []}
				Info={<MapFileInfo />}
				filesHeading={sprintf(t('filesIn'), '(.mbtiles)')}
				noFilesHeading={sprintf(t('noFilesIn'), '(.mbtiles)')}
			/>

			<NumericMultiRowControl
				label={t('enabled')}
				optKeys={enabledOptions.keys}
				optLabels={enabledOptions.labels}
				options={layerTemp?.options ?? {}}
				setOptions={setOptions}
				validate={validateZoom}
				Info={t('baseMap.hint.enabled') + '\n\n' + t('baseMap.hint.zoomGeneralInfo')}
			/>
		</View>
	);
};

export default LayerControlRasterMBTiles;
